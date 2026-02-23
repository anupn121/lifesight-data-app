// Shared types for AI-based EDA system

export type EDACategory =
  | "Data Quality & Profiling"
  | "Univariate Analysis"
  | "Bivariate & Multivariate"
  | "Time Series"
  | "Outlier & Anomaly Detection"
  | "Marketing AI Insights";

export interface AIInsight {
  insight: string;
  confidence: "High" | "Medium" | "Low";
  recommendations?: string[];
}

export interface EDAComponentDef {
  id: string;
  name: string;
  description: string;
  category: EDACategory;
  defaultSelected: boolean;
}

export const CATEGORY_COLORS: Record<EDACategory, string> = {
  "Data Quality & Profiling": "#00bc7d",
  "Univariate Analysis": "#2b7fff",
  "Bivariate & Multivariate": "#6941c6",
  "Time Series": "#f59e0b",
  "Outlier & Anomaly Detection": "#ef4444",
  "Marketing AI Insights": "#ec4899",
};

export const EDA_REGISTRY: EDAComponentDef[] = [
  // Category 1: Data Quality & Profiling
  { id: "dataProfile", name: "Data Profile", description: "Type, unique count, completeness per column", category: "Data Quality & Profiling", defaultSelected: true },
  { id: "missing", name: "Missing Data", description: "Missing counts, percentages, gap heatmap", category: "Data Quality & Profiling", defaultSelected: true },
  { id: "duplicateDetection", name: "Duplicate Detection", description: "Exact and near-duplicate detection", category: "Data Quality & Profiling", defaultSelected: false },
  { id: "consistencyCheck", name: "Consistency Check", description: "Data validation rules and pass/fail checks", category: "Data Quality & Profiling", defaultSelected: true },
  { id: "dataQualityScore", name: "Data Quality Score", description: "Composite quality gauge with breakdown", category: "Data Quality & Profiling", defaultSelected: true },

  // Category 2: Univariate Analysis
  { id: "summary", name: "Summary Statistics", description: "Count, mean, std, quartiles, skewness, kurtosis", category: "Univariate Analysis", defaultSelected: true },
  { id: "distribution", name: "Distribution Charts", description: "Histograms with normality badges", category: "Univariate Analysis", defaultSelected: true },
  { id: "boxPlot", name: "Box Plots", description: "Horizontal box plots for all numerics", category: "Univariate Analysis", defaultSelected: false },
  { id: "normalityTest", name: "Normality Test", description: "Statistical tests with Q-Q plots", category: "Univariate Analysis", defaultSelected: false },
  { id: "descriptiveCards", name: "Descriptive Cards", description: "Mini metric cards with sparklines and trends", category: "Univariate Analysis", defaultSelected: true },

  // Category 3: Bivariate & Multivariate
  { id: "correlation", name: "Correlation Matrix", description: "Pairwise correlation heatmap with top pairs", category: "Bivariate & Multivariate", defaultSelected: true },
  { id: "scatterPlot", name: "Scatter Plots", description: "Scatter plots with regression lines", category: "Bivariate & Multivariate", defaultSelected: false },
  { id: "multicollinearity", name: "Multicollinearity", description: "VIF analysis for spend variables", category: "Bivariate & Multivariate", defaultSelected: true },
  { id: "pca", name: "PCA", description: "Principal component analysis with scree plot", category: "Bivariate & Multivariate", defaultSelected: false },
  { id: "clustering", name: "Clustering", description: "K-means clustering with 2D projection", category: "Bivariate & Multivariate", defaultSelected: false },

  // Category 4: Time Series
  { id: "trendDecomposition", name: "Trend Decomposition", description: "Trend, seasonal, and residual components", category: "Time Series", defaultSelected: true },
  { id: "seasonality", name: "Seasonality", description: "Seasonal patterns with heatmap", category: "Time Series", defaultSelected: true },
  { id: "stationarity", name: "Stationarity Check", description: "ADF test with differencing recommendation", category: "Time Series", defaultSelected: true },
  { id: "acfPacf", name: "ACF / PACF", description: "Autocorrelation and partial autocorrelation plots", category: "Time Series", defaultSelected: false },
  { id: "changePoint", name: "Change Points", description: "Structural break detection in time series", category: "Time Series", defaultSelected: false },

  // Category 5: Outlier & Anomaly Detection
  { id: "outlier", name: "Outlier Detection", description: "IQR-based outlier identification with strip plots", category: "Outlier & Anomaly Detection", defaultSelected: true },
  { id: "timeSeriesAnomaly", name: "Time Series Anomalies", description: "Anomaly detection with confidence bands", category: "Outlier & Anomaly Detection", defaultSelected: false },
  { id: "spendAnomaly", name: "Spend Anomalies", description: "Channel spend anomaly timeline", category: "Outlier & Anomaly Detection", defaultSelected: false },
  { id: "outlierImpact", name: "Outlier Impact", description: "Impact analysis: full vs trimmed data", category: "Outlier & Anomaly Detection", defaultSelected: false },

  // Category 6: Marketing AI Insights
  { id: "spendResponseCurve", name: "Spend-Response Curves", description: "Saturation curves per channel", category: "Marketing AI Insights", defaultSelected: true },
  { id: "channelContribution", name: "Channel Contribution", description: "Estimated contribution per channel", category: "Marketing AI Insights", defaultSelected: true },
  { id: "featureImportance", name: "Feature Importance", description: "Ranked feature importance scores", category: "Marketing AI Insights", defaultSelected: true },
  { id: "adstockEstimate", name: "Adstock Estimation", description: "Decay rates and half-life estimates", category: "Marketing AI Insights", defaultSelected: false },
  { id: "keyFindings", name: "Key Findings", description: "Executive summary of top findings", category: "Marketing AI Insights", defaultSelected: true },
];
