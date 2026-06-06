from __future__ import annotations

import logging
import os
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
import scipy.sparse as sp
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import MinMaxScaler

logger = logging.getLogger(__name__)


# ─────────────────────────────────────────────────────────────────────────────
# Configuration
# ─────────────────────────────────────────────────────────────────────────────

@dataclass
class RecoConfig:
    # ── Collaborative filtering (ALS) ─────────────────────────────────────────
    als_factors: int = 128          # latent dimension; 64–256 common in prod
    als_iterations: int = 30        # more → better quality, slower training
    als_regularization: float = 0.01
    als_alpha: float = 40.0         # confidence scaling for implicit feedback

    # ── Content-based (TF-IDF) ───────────────────────────────────────────────
    tfidf_max_features: int = 15_000
    tfidf_min_df: int = 2           # ignore tokens appearing in <2 items

    # ── Hybrid fusion weights (must sum to 1.0) ───────────────────────────────
    collab_weight: float = 0.55
    content_weight: float = 0.30
    popularity_weight: float = 0.15

    # ── Candidate generation ─────────────────────────────────────────────────
    num_candidates: int = 500       # items to score before the ranker
    num_results: int = 20           # final items returned per request

    # ── Ranking / post-processing ─────────────────────────────────────────────
    freshness_days: int = 30        # half-life for exponential freshness decay
    freshness_boost: float = 0.12
    diversity_penalty: float = 0.08 # penalise 3rd-consecutive same-genre item

    # ── Cold start ────────────────────────────────────────────────────────────
    min_interactions: int = 5       # users below this threshold → cold-start path


# ─────────────────────────────────────────────────────────────────────────────
# 1. Interaction Matrix
# ─────────────────────────────────────────────────────────────────────────────

class InteractionMatrix:
    def __init__(self) -> None:
        self.user2idx: Dict[str, int] = {}
        self.item2idx: Dict[str, int] = {}
        self.idx2item: Dict[int, str] = {}
        self.matrix: Optional[sp.csr_matrix] = None
        self._popularity: Optional[np.ndarray] = None

    def fit(
        self,
        watch_df: pd.DataFrame,
        ratings_df: Optional[pd.DataFrame] = None,
        search_df: Optional[pd.DataFrame] = None,
    ) -> "InteractionMatrix":
        frames = [self._weight_watch(watch_df)]
        if ratings_df is not None and not ratings_df.empty:
            frames.append(self._weight_ratings(ratings_df))
        if search_df is not None and not search_df.empty:
            frames.append(self._weight_search(search_df))

        events = (
            pd.concat(frames, ignore_index=True)
              .groupby(["user_id", "item_id"])["weight"]
              .max()
              .reset_index()
        )

        self.user2idx = {u: i for i, u in enumerate(events["user_id"].unique())}
        self.item2idx = {v: i for i, v in enumerate(events["item_id"].unique())}
        self.idx2item = {i: v for v, i in self.item2idx.items()}

        rows = events["user_id"].map(self.user2idx).values
        cols = events["item_id"].map(self.item2idx).values
        data = events["weight"].values.astype(np.float32)
        shape = (len(self.user2idx), len(self.item2idx))
        self.matrix = sp.csr_matrix((data, (rows, cols)), shape=shape)

        counts = np.asarray(self.matrix.sum(axis=0)).flatten()
        self._popularity = np.log1p(counts) / (np.log1p(counts).max() + 1e-9)

        logger.info(
            "InteractionMatrix: %d users, %d items, %d interactions",
            len(self.user2idx), len(self.item2idx), self.matrix.nnz,
        )
        return self

    def user_interaction_count(self, user_id: str) -> int:
        idx = self.user2idx.get(user_id)
        return 0 if idx is None else int(self.matrix[idx].nnz)

    def popularity(self) -> np.ndarray:
        assert self._popularity is not None, "Call fit() first"
        return self._popularity

    def _weight_watch(self, df: pd.DataFrame) -> pd.DataFrame:
        cp = df.get("completion_pct", pd.Series(np.ones(len(df), dtype=float), index=df.index))
        base = np.where(cp >= 0.8, 3.0, np.where(cp >= 0.2, 1.5, 0.5))
        if "watch_count" in df.columns:
            base = base * (1.0 + np.log1p(df["watch_count"].fillna(0)) * 0.4)
        return pd.DataFrame({"user_id": df["user_id"], "item_id": df["item_id"], "weight": base})

    def _weight_ratings(self, df: pd.DataFrame) -> pd.DataFrame:
        return pd.DataFrame({
            "user_id": df["user_id"],
            "item_id": df["item_id"],
            "weight": df["rating"].astype(float),
        })

    def _weight_search(self, df: pd.DataFrame) -> pd.DataFrame:
        weights = df["signal_type"].map({"click": 1.0, "browse": 0.7}).fillna(0.5)
        return pd.DataFrame({"user_id": df["user_id"], "item_id": df["item_id"], "weight": weights})


# ─────────────────────────────────────────────────────────────────────────────
# 2. Collaborative Filter (ALS)
# ─────────────────────────────────────────────────────────────────────────────

class CollaborativeFilter:
    def __init__(self, config: RecoConfig) -> None:
        self.config = config
        self._model = None

    def fit(self, matrix: InteractionMatrix) -> "CollaborativeFilter":
        if matrix.matrix.nnz == 0:
            logger.info("ALS skipped (empty matrix)")
            return self
            
        try:
            import implicit
        except ImportError:
            raise ImportError("Run: pip install implicit")

        self._model = implicit.als.AlternatingLeastSquares(
            factors=self.config.als_factors,
            iterations=self.config.als_iterations,
            regularization=self.config.als_regularization,
            alpha=self.config.als_alpha,
            use_gpu=False,
            calculate_training_loss=True,
        )
        self._model.fit(matrix.matrix.T.tocsr())
        return self

    def recommend(
        self,
        user_idx: int,
        matrix: InteractionMatrix,
        n: int = 500,
    ) -> Tuple[np.ndarray, np.ndarray]:
        if self._model is None:
            return np.array([]), np.array([])
        user_items = matrix.matrix.astype(np.float32)
        ids, scores = self._model.recommend(
            user_idx,
            user_items[user_idx],
            N=n,
            filter_already_liked_items=True,
        )
        return np.asarray(ids), np.asarray(scores)

    def user_embedding(self, user_idx: int) -> np.ndarray:
        return self._model.user_factors[user_idx]

    def item_embedding(self, item_idx: int) -> np.ndarray:
        return self._model.item_factors[item_idx]


# ─────────────────────────────────────────────────────────────────────────────
# 3. Content Filter (TF-IDF)
# ─────────────────────────────────────────────────────────────────────────────

class ContentFilter:
    def __init__(self, config: RecoConfig) -> None:
        self.config = config
        self.vectorizer = TfidfVectorizer(
            max_features=config.tfidf_max_features,
            min_df=config.tfidf_min_df,
            ngram_range=(1, 2),
            sublinear_tf=True,
            strip_accents="unicode",
        )
        self.item_vectors: Optional[sp.csr_matrix] = None
        self.item_ids: List[str] = []

    def fit(self, content_df: pd.DataFrame) -> "ContentFilter":
        if content_df.empty:
            return self
            
        self.item_ids = content_df["item_id"].tolist()
        feature_strings = content_df.apply(self._row_to_string, axis=1)
        # Avoid error if corpus is too small
        if len(feature_strings) < self.config.tfidf_min_df:
            self.vectorizer.min_df = 1
        self.item_vectors = self.vectorizer.fit_transform(feature_strings)
        return self

    def recommend(
        self,
        liked_item_indices: List[int],
        n: int = 500,
    ) -> Tuple[np.ndarray, np.ndarray]:
        if not liked_item_indices or self.item_vectors is None:
            return np.array([], dtype=int), np.array([], dtype=float)

        liked_vecs = self.item_vectors[liked_item_indices]
        user_profile = np.asarray(liked_vecs.mean(axis=0))
        sims = cosine_similarity(user_profile, self.item_vectors).flatten()
        sims[liked_item_indices] = -1.0

        n = min(n, len(sims))
        if n == 0:
            return np.array([]), np.array([])
        top_idx = np.argpartition(sims, -n)[-n:]
        top_idx = top_idx[np.argsort(sims[top_idx])[::-1]]
        return top_idx, sims[top_idx]

    def item_similarity(
        self, item_idx: int, n: int = 20
    ) -> Tuple[np.ndarray, np.ndarray]:
        if self.item_vectors is None:
            return np.array([]), np.array([])
        vec = self.item_vectors[item_idx]
        sims = cosine_similarity(vec, self.item_vectors).flatten()
        sims[item_idx] = -1.0
        
        n = min(n, len(sims))
        if n == 0:
            return np.array([]), np.array([])
        top_idx = np.argpartition(sims, -n)[-n:]
        top_idx = top_idx[np.argsort(sims[top_idx])[::-1]]
        return top_idx, sims[top_idx]

    def _row_to_string(self, row: pd.Series) -> str:
        parts: List[str] = []
        if pd.notna(row.get("genre")):   parts += [str(row["genre"])] * 3
        if pd.notna(row.get("tags")):    parts += [str(row["tags"])] * 2
        for f in ["title", "description", "cast", "director", "country"]:
            if pd.notna(row.get(f)):     parts.append(str(row[f]))
        return " ".join(parts)


# ─────────────────────────────────────────────────────────────────────────────
# 4. Cold Start Handler
# ─────────────────────────────────────────────────────────────────────────────

class ColdStartHandler:
    def __init__(self, config: RecoConfig) -> None:
        self.config = config
        self._global_popular: Optional[np.ndarray] = None
        self._genre_item_mask: Dict[str, np.ndarray] = {}

    def fit(
        self,
        content_df: pd.DataFrame,
        matrix: InteractionMatrix,
        user_df: Optional[pd.DataFrame] = None,
    ) -> "ColdStartHandler":
        if matrix._popularity is None:
            self._global_popular = np.zeros(0)
            return self
            
        self._global_popular = matrix.popularity()
        n_items = len(matrix.item2idx)

        if "genre" in content_df.columns:
            for genre in content_df["genre"].dropna().unique():
                mask = np.zeros(n_items, dtype=np.float32)
                for item_id in content_df.loc[content_df["genre"] == genre, "item_id"]:
                    idx = matrix.item2idx.get(item_id)
                    if idx is not None:
                        mask[idx] = self._global_popular[idx]
                total = mask.sum()
                if total > 0:
                    self._genre_item_mask[genre] = mask / total

        return self

    def recommend(
        self,
        n: int,
        user_profile: Optional[Dict] = None,
    ) -> Tuple[np.ndarray, np.ndarray]:
        if self._global_popular is None or len(self._global_popular) == 0:
            return np.array([]), np.array([])
            
        scores = self._global_popular.copy()

        if user_profile:
            for genre in user_profile.get("preferred_genres", []):
                genre_scores = self._genre_item_mask.get(genre)
                if genre_scores is not None:
                    scores = scores + 0.35 * genre_scores

        n = min(n, len(scores))
        if n == 0:
            return np.array([]), np.array([])
            
        top_idx = np.argpartition(scores, -n)[-n:]
        top_idx = top_idx[np.argsort(scores[top_idx])[::-1]]
        return top_idx, scores[top_idx]


# ─────────────────────────────────────────────────────────────────────────────
# 5. Hybrid Scorer
# ─────────────────────────────────────────────────────────────────────────────

class HybridScorer:
    def __init__(self, config: RecoConfig) -> None:
        self.config = config

    def get_candidates(
        self,
        user_id: str,
        matrix: InteractionMatrix,
        collab: CollaborativeFilter,
        content: ContentFilter,
        cold_start: ColdStartHandler,
        user_profile: Optional[Dict] = None,
        n_candidates: int = 500,
    ) -> pd.DataFrame:
        n_interactions = matrix.user_interaction_count(user_id)
        user_idx = matrix.user2idx.get(user_id)
        scores: Dict[int, Dict[str, float]] = {}

        if user_idx is not None and n_interactions >= self.config.min_interactions:
            ids, raw = collab.recommend(user_idx, matrix, n=n_candidates)
            for item_idx, s in zip(ids, self._normalise(raw)):
                scores.setdefault(int(item_idx), {})["collab"] = float(s)

        if user_idx is not None and matrix.matrix is not None and matrix.matrix[user_idx].nnz > 0:
            row = matrix.matrix[user_idx]
            top_liked = sorted(row.indices.tolist(), key=lambda i: row[0, i], reverse=True)[:50]
            ids, raw = content.recommend(top_liked, n=n_candidates)
            for item_idx, s in zip(ids, self._normalise(raw)):
                scores.setdefault(int(item_idx), {})["content"] = float(s)

        cs_ids, cs_raw = cold_start.recommend(n=n_candidates, user_profile=user_profile)
        for item_idx, s in zip(cs_ids, self._normalise(cs_raw)):
            scores.setdefault(int(item_idx), {})["cold"] = float(s)

        cfg = self.config
        records = []
        for item_idx, s in scores.items():
            hybrid = (
                cfg.collab_weight     * s.get("collab",  0.0) +
                cfg.content_weight    * s.get("content", 0.0) +
                cfg.popularity_weight * s.get("cold",    0.0)
            )
            records.append({
                "item_idx":      item_idx,
                "item_id":       matrix.idx2item.get(item_idx, str(item_idx)),
                "collab_score":  s.get("collab",  0.0),
                "content_score": s.get("content", 0.0),
                "cold_score":    s.get("cold",    0.0),
                "hybrid_score":  hybrid,
            })

        if not records:
            return pd.DataFrame(columns=["item_idx", "item_id", "collab_score", "content_score", "cold_score", "hybrid_score"])
            
        return (
            pd.DataFrame(records)
              .sort_values("hybrid_score", ascending=False)
              .reset_index(drop=True)
        )

    @staticmethod
    def _normalise(scores: np.ndarray) -> np.ndarray:
        if len(scores) == 0:
            return scores
        lo, hi = scores.min(), scores.max()
        return np.zeros_like(scores) if hi == lo else (scores - lo) / (hi - lo)


# ─────────────────────────────────────────────────────────────────────────────
# 6. LightGBM Learns-to-Rank
# ─────────────────────────────────────────────────────────────────────────────

class LTRRanker:
    FEATURE_COLS = [
        "hybrid_score", "collab_score", "content_score", "cold_score",
        "item_popularity", "item_freshness_score",
        "user_avg_rating", "user_genre_affinity", "genre_diversity_rank",
    ]

    def __init__(self, config: RecoConfig) -> None:
        self.config = config
        self.model = None
        self._lgb_params = {
            "objective": "lambdarank",
            "metric": "ndcg",
            "ndcg_eval_at": [5, 10, 20],
            "learning_rate": 0.05,
            "num_leaves": 63,
            "min_data_in_leaf": 20,
            "max_depth": 6,
            "verbose": -1,
        }

    def fit(
        self,
        train_df: pd.DataFrame,
        valid_df: Optional[pd.DataFrame] = None,
    ) -> "LTRRanker":
        try:
            import lightgbm as lgb
        except ImportError:
            raise ImportError("Run: pip install lightgbm")

        feature_cols = [c for c in self.FEATURE_COLS if c in train_df.columns]
        X_train = train_df[feature_cols].fillna(0.0)
        y_train = train_df["label"].values
        groups_train = train_df.groupby("user_id", sort=False).size().values

        ds_train = lgb.Dataset(X_train, label=y_train, group=groups_train, free_raw_data=False)
        valid_sets = [ds_train]

        if valid_df is not None:
            X_valid = valid_df[feature_cols].fillna(0.0)
            y_valid = valid_df["label"].values
            groups_valid = valid_df.groupby("user_id", sort=False).size().values
            ds_valid = lgb.Dataset(X_valid, label=y_valid, group=groups_valid, reference=ds_train)
            valid_sets.append(ds_valid)

        self.model = lgb.train(
            self._lgb_params,
            ds_train,
            num_boost_round=300,
            valid_sets=valid_sets,
            callbacks=[lgb.log_evaluation(period=50), lgb.early_stopping(20, verbose=False)],
        )
        return self

    def build_features(
        self,
        candidates: pd.DataFrame,
        content_df: pd.DataFrame,
        matrix: InteractionMatrix,
        user_id: str,
    ) -> pd.DataFrame:
        df = candidates.copy()
        content_idx = content_df.set_index("item_id")

        if "release_date" in content_df.columns:
            release = df["item_id"].map(content_idx.get("release_date", pd.Series(dtype="object")))
            days_old = (pd.Timestamp.utcnow() - pd.to_datetime(release, utc=True)).dt.days.fillna(9999)
            df["item_freshness_score"] = np.exp(-days_old.values / self.config.freshness_days)
        else:
            df["item_freshness_score"] = 0.5

        pop = matrix.popularity() if matrix._popularity is not None else []
        df["item_popularity"] = df["item_idx"].map(
            lambda i: float(pop[i]) if 0 <= i < len(pop) else 0.0
        )

        user_idx = matrix.user2idx.get(user_id)
        if user_idx is not None and matrix.matrix is not None:
            row_data = matrix.matrix[user_idx].data
            df["user_avg_rating"] = float(row_data.mean()) if len(row_data) > 0 else 0.0
        else:
            df["user_avg_rating"] = 0.0

        if "genre" in content_df.columns and user_idx is not None and matrix.matrix is not None:
            item_genres = df["item_id"].map(
                content_idx.get("genre", pd.Series(dtype=str))
            )
            user_item_ids = [matrix.idx2item[i] for i in matrix.matrix[user_idx].indices]
            user_genres = content_df[content_df["item_id"].isin(user_item_ids)]["genre"]
            genre_dist = user_genres.value_counts(normalize=True).to_dict()
            df["user_genre_affinity"] = item_genres.map(genre_dist).fillna(0.0)
        else:
            df["user_genre_affinity"] = 0.0

        df["genre_diversity_rank"] = 1.0
        return df

    def rank(self, candidates: pd.DataFrame) -> pd.DataFrame:
        if self.model is None or candidates.empty:
            return candidates.sort_values("hybrid_score", ascending=False)

        feature_cols = [c for c in self.FEATURE_COLS if c in candidates.columns]
        X = candidates[feature_cols].fillna(0.0).values
        df = candidates.copy()
        df["rank_score"] = self.model.predict(X)
        return df.sort_values("rank_score", ascending=False).reset_index(drop=True)

    def save(self, path: str) -> None:
        if self.model:
            self.model.save_model(path)

    def load(self, path: str) -> "LTRRanker":
        import lightgbm as lgb
        self.model = lgb.Booster(model_file=path)
        return self


# ─────────────────────────────────────────────────────────────────────────────
# 7. Top-level Engine Facade
# ─────────────────────────────────────────────────────────────────────────────

class RecommendationEngine:
    def __init__(self, config: Optional[RecoConfig] = None) -> None:
        self.config = config or RecoConfig()
        self.matrix = InteractionMatrix()
        self.collab = CollaborativeFilter(self.config)
        self.content = ContentFilter(self.config)
        self.cold_start = ColdStartHandler(self.config)
        self.hybrid = HybridScorer(self.config)
        self.ranker = LTRRanker(self.config)
        self._content_df: Optional[pd.DataFrame] = None
        self._fitted = False

    def fit(
        self,
        watch_df: pd.DataFrame,
        content_df: pd.DataFrame,
        ratings_df: Optional[pd.DataFrame] = None,
        search_df: Optional[pd.DataFrame] = None,
        user_df: Optional[pd.DataFrame] = None,
        ltr_train_df: Optional[pd.DataFrame] = None,
        ltr_valid_df: Optional[pd.DataFrame] = None,
    ) -> "RecommendationEngine":
        self.matrix.fit(watch_df, ratings_df, search_df)
        self.collab.fit(self.matrix)
        self.content.fit(content_df)
        self.cold_start.fit(content_df, self.matrix, user_df)

        if ltr_train_df is not None and not ltr_train_df.empty:
            self.ranker.fit(ltr_train_df, ltr_valid_df)

        self._content_df = content_df
        self._fitted = True
        return self

    def recommend(
        self,
        user_id: str,
        n: int = 20,
        user_profile: Optional[Dict] = None,
        exclude_items: Optional[List[str]] = None,
    ) -> List[Dict]:
        if not self._fitted:
            return []

        candidates = self.hybrid.get_candidates(
            user_id=user_id,
            matrix=self.matrix,
            collab=self.collab,
            content=self.content,
            cold_start=self.cold_start,
            user_profile=user_profile,
            n_candidates=self.config.num_candidates,
        )

        if candidates.empty:
            return []

        if exclude_items:
            candidates = candidates[~candidates["item_id"].isin(set(exclude_items))]

        if self._content_df is not None:
            candidates = self.ranker.build_features(
                candidates, self._content_df, self.matrix, user_id
            )

        ranked = self.ranker.rank(candidates)
        diversified = self._apply_diversity(ranked, pool_size=n * 4)

        score_col = "rank_score" if "rank_score" in diversified.columns else "hybrid_score"
        results = []
        for rank, (_, row) in enumerate(diversified.head(n).iterrows(), start=1):
            
            # look up metadata from content_df
            meta = {}
            if self._content_df is not None:
                item_row = self._content_df[self._content_df["item_id"] == row["item_id"]]
                if not item_row.empty:
                    ir = item_row.iloc[0]
                    meta = {
                        "title": ir.get("title", ""),
                        "description": ir.get("description", ""),
                        "coverImage": ir.get("coverImage", ""),
                        "bannerImage": ir.get("bannerImage", ""),
                        "type": ir.get("type", "anime")
                    }
                    
            results.append({
                "item_id":      row["item_id"],
                "rank":         rank,
                "hybrid_score": round(float(row.get("hybrid_score", 0)), 4),
                "rank_score":   round(float(row.get(score_col, 0)), 4),
                "explanation":  self._explain(row),
                **meta
            })
        return results

    def _apply_diversity(self, ranked: pd.DataFrame, pool_size: int) -> pd.DataFrame:
        if self._content_df is None or "genre" not in self._content_df.columns:
            return ranked

        content_idx = self._content_df.set_index("item_id")
        ranked = ranked.copy()
        ranked["_genre"] = ranked["item_id"].map(
            content_idx.get("genre", pd.Series(dtype=str))
        ).fillna("unknown")

        score_col = "rank_score" if "rank_score" in ranked.columns else "hybrid_score"
        result_rows: List[pd.Series] = []
        genre_window: List[str] = []

        for _, row in ranked.head(pool_size).iterrows():
            g = row["_genre"]
            if genre_window.count(g) >= 2:
                row = row.copy()
                row[score_col] = float(row[score_col]) - self.config.diversity_penalty
            genre_window.append(g)
            if len(genre_window) > 3:
                genre_window.pop(0)
            result_rows.append(row)

        return (
            pd.DataFrame(result_rows)
              .sort_values(score_col, ascending=False)
              .drop(columns=["_genre"], errors="ignore")
              .reset_index(drop=True)
        )

    @staticmethod
    def _explain(row: pd.Series) -> str:
        collab  = row.get("collab_score",  0.0)
        content = row.get("content_score", 0.0)
        cold    = row.get("cold_score",    0.0)
        fresh   = row.get("item_freshness_score", 0.0)
        if fresh > 0.8:
            return "New release you might enjoy"
        if collab > content and collab > cold:
            return "Recommended because viewers like you enjoyed this"
        if content > cold:
            return "Similar to titles you've watched"
        return "Popular right now"

    def save(self, directory: str) -> None:
        os.makedirs(directory, exist_ok=True)
        joblib.dump(self.matrix,      f"{directory}/interaction_matrix.pkl")
        joblib.dump(self.collab,      f"{directory}/collab_filter.pkl")
        joblib.dump(self.content,     f"{directory}/content_filter.pkl")
        joblib.dump(self.cold_start,  f"{directory}/cold_start.pkl")
        joblib.dump(self.config,      f"{directory}/config.pkl")
        if self.ranker.model is not None:
            self.ranker.save(f"{directory}/ranker.lgb")
        if self._content_df is not None:
            self._content_df.to_parquet(f"{directory}/content_df.parquet", index=False)

    @classmethod
    def load(cls, directory: str) -> "RecommendationEngine":
        config = joblib.load(f"{directory}/config.pkl")
        engine = cls(config)
        engine.matrix     = joblib.load(f"{directory}/interaction_matrix.pkl")
        engine.collab     = joblib.load(f"{directory}/collab_filter.pkl")
        engine.content    = joblib.load(f"{directory}/content_filter.pkl")
        engine.cold_start = joblib.load(f"{directory}/cold_start.pkl")
        if os.path.exists(f"{directory}/ranker.lgb"):
            engine.ranker.load(f"{directory}/ranker.lgb")
        if os.path.exists(f"{directory}/content_df.parquet"):
            engine._content_df = pd.read_parquet(f"{directory}/content_df.parquet")
        engine._fitted = True
        return engine
