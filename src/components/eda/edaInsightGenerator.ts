// Deterministic AI insight text generator
// Pure functions that take computed stats and return natural-language insights
import type { AIInsight } from "./edaTypes";

// --- Data Quality & Profiling ---

export function generateDataProfileInsight(completenessAvg: number, totalCols: number, numericCols: number): AIInsight {
  const confidence = completenessAvg > 90 ? "High" : completenessAvg > 70 ? "Medium" : "Low";
  const insight = completenessAvg > 95
    ? `Dataset contains ${totalCols} columns (${numericCols} numeric) with excellent completeness at ${completenessAvg.toFixed(1)}%. Data is well-structured for analysis.`
    : completenessAvg > 80
    ? `Dataset has ${totalCols} columns with ${completenessAvg.toFixed(1)}% average completeness. Some columns may need imputation before modeling.`
    : `Dataset completeness is ${completenessAvg.toFixed(1)}% across ${totalCols} columns. Significant missing data detected that requires attention.`;
  return {
    insight, confidence,
    recommendations: completenessAvg < 95
      ? ["Consider imputing missing values using median/mode for numeric columns", "Investigate root cause of data gaps before modeling"]
      : ["Data quality is sufficient for direct modeling", "Monitor completeness over time for drift"],
  };
}

export function generateMissingDataInsight(maxPct: number, avgPct: number, colsWithMissing: number, totalCols: number): AIInsight {
  const confidence = avgPct < 5 ? "High" : avgPct < 15 ? "Medium" : "Low";
  const insight = avgPct < 2
    ? `Minimal missing data detected — only ${colsWithMissing} of ${totalCols} columns have gaps, averaging ${avgPct.toFixed(1)}%. No immediate action needed.`
    : avgPct < 10
    ? `Moderate missingness found in ${colsWithMissing} columns (avg ${avgPct.toFixed(1)}%, max ${maxPct.toFixed(1)}%). Pattern analysis suggests intermittent data collection gaps.`
    : `High missing data rate of ${avgPct.toFixed(1)}% average across ${colsWithMissing} columns. The worst column has ${maxPct.toFixed(1)}% missing values.`;
  return {
    insight, confidence,
    recommendations: maxPct > 10
      ? ["Investigate columns with >10% missingness for data pipeline issues", "Use multiple imputation for modeling if MCAR assumption holds", "Consider dropping columns with >50% missing values"]
      : ["Current missing data levels are acceptable for most analyses", "Apply forward-fill for time series gaps"],
  };
}

export function generateDuplicateInsight(exactDups: number, nearDups: number, totalRows: number): AIInsight {
  const dupRate = ((exactDups + nearDups) / totalRows) * 100;
  const confidence = dupRate < 1 ? "High" : dupRate < 5 ? "Medium" : "Low";
  const insight = exactDups === 0 && nearDups === 0
    ? `No duplicate records detected across ${totalRows} rows. Data appears to be properly deduplicated.`
    : `Found ${exactDups} exact duplicates and ${nearDups} near-duplicates (${dupRate.toFixed(1)}% of total). This could inflate model estimates.`;
  return {
    insight, confidence,
    recommendations: dupRate > 0
      ? ["Remove exact duplicates before modeling", "Review near-duplicates for legitimate vs erroneous entries", "Check data ingestion pipeline for deduplication logic"]
      : ["Deduplication checks passed — data is clean"],
  };
}

export function generateConsistencyInsight(passCount: number, totalChecks: number): AIInsight {
  const passRate = totalChecks > 0 ? (passCount / totalChecks) * 100 : 100;
  const confidence = passRate > 90 ? "High" : passRate > 70 ? "Medium" : "Low";
  const insight = passRate === 100
    ? `All ${totalChecks} consistency checks passed. Data conforms to expected business rules and ranges.`
    : `${passCount} of ${totalChecks} consistency checks passed (${passRate.toFixed(0)}%). Some data quality rules were violated.`;
  return {
    insight, confidence,
    recommendations: passRate < 100
      ? ["Fix failing consistency checks before running models", "Add automated validation rules to your data pipeline", "Document acceptable value ranges for each variable"]
      : ["Data consistency is excellent — ready for modeling"],
  };
}

export function generateDataQualityScoreInsight(score: number): AIInsight {
  const confidence = score > 80 ? "High" : score > 60 ? "Medium" : "Low";
  const insight = score > 85
    ? `Overall data quality score is ${score}/100 — excellent. Your dataset meets high standards for completeness, consistency, and validity.`
    : score > 65
    ? `Data quality score is ${score}/100 — good but with room for improvement. Focus on the lowest-scoring dimensions.`
    : `Data quality score is ${score}/100 — needs attention. Multiple quality dimensions are below acceptable thresholds.`;
  return {
    insight, confidence,
    recommendations: score < 80
      ? ["Address completeness gaps first as they have the highest impact", "Implement data validation at ingestion time", "Set up quality monitoring dashboards"]
      : ["Maintain current data quality standards", "Set up alerts for quality degradation"],
  };
}

// --- Univariate Analysis ---

export function generateSummaryStatsInsight(varCount: number, highSkewCount: number, highKurtCount: number): AIInsight {
  const confidence = highSkewCount < varCount * 0.3 ? "High" : "Medium";
  const insight = highSkewCount === 0
    ? `All ${varCount} numeric variables show approximately symmetric distributions. Standard parametric methods are appropriate.`
    : `${highSkewCount} of ${varCount} variables show significant skewness (|skew| > 1). ${highKurtCount > 0 ? `${highKurtCount} show heavy tails (excess kurtosis > 2).` : "Tail behavior is normal."}`;
  return {
    insight, confidence,
    recommendations: highSkewCount > 0
      ? ["Apply log or Box-Cox transforms to highly skewed variables", "Use robust statistics (median, IQR) instead of mean/std for skewed data", "Consider non-parametric tests for skewed distributions"]
      : ["Distributions are well-behaved for standard statistical methods"],
  };
}

export function generateDistributionInsight(normalCount: number, totalCount: number): AIInsight {
  const normalPct = totalCount > 0 ? (normalCount / totalCount) * 100 : 0;
  const confidence = normalPct > 60 ? "High" : normalPct > 30 ? "Medium" : "Low";
  const insight = normalPct > 70
    ? `${normalCount} of ${totalCount} distributions appear approximately normal. Parametric methods (t-tests, linear regression) are well-suited for this data.`
    : `Only ${normalCount} of ${totalCount} distributions pass normality checks. Consider non-parametric alternatives or transformations.`;
  return {
    insight, confidence,
    recommendations: normalPct < 70
      ? ["Try log, square root, or Box-Cox transformations for non-normal variables", "Use bootstrap methods for confidence intervals", "Consider rank-based correlation instead of Pearson"]
      : ["Current distributions support standard parametric analysis"],
  };
}

export function generateBoxPlotInsight(outlierVars: number, totalVars: number, maxOutlierPct: number): AIInsight {
  const confidence = outlierVars < totalVars * 0.3 ? "High" : "Medium";
  const insight = outlierVars === 0
    ? `No significant outliers detected across ${totalVars} variables. Value ranges are consistent.`
    : `${outlierVars} of ${totalVars} variables contain outliers (max: ${maxOutlierPct.toFixed(1)}%). These may represent genuine extreme values or data errors.`;
  return {
    insight, confidence,
    recommendations: outlierVars > 0
      ? ["Investigate outliers for business validity before removal", "Use winsorization (capping at 1st/99th percentile) as an alternative to removal"]
      : ["Box plots show clean, well-bounded distributions"],
  };
}

export function generateNormalityInsight(passCount: number, totalCount: number): AIInsight {
  const confidence = passCount > totalCount * 0.5 ? "High" : "Medium";
  const insight = passCount === totalCount
    ? `All ${totalCount} variables pass normality tests (Shapiro-Wilk, p > 0.05). Gaussian assumptions are valid.`
    : `${passCount} of ${totalCount} variables pass normality tests. ${totalCount - passCount} variables show non-Gaussian behavior.`;
  return {
    insight, confidence,
    recommendations: passCount < totalCount
      ? ["Apply transforms to non-normal variables for parametric models", "Consider using Generalized Linear Models for non-normal response variables"]
      : ["Data is suitable for parametric statistical methods"],
  };
}

export function generateDescriptiveCardsInsight(trendUpCount: number, trendDownCount: number, totalVars: number): AIInsight {
  const confidence: AIInsight["confidence"] = "High";
  const insight = trendUpCount > trendDownCount
    ? `${trendUpCount} of ${totalVars} metrics show upward trends, ${trendDownCount} declining. Overall positive momentum in the dataset.`
    : trendDownCount > trendUpCount
    ? `${trendDownCount} of ${totalVars} metrics show declining trends, with only ${trendUpCount} increasing. Warrants closer investigation.`
    : `Metrics are evenly split between upward (${trendUpCount}) and downward (${trendDownCount}) trends. Mixed signals across variables.`;
  return {
    insight, confidence,
    recommendations: ["Monitor declining metrics for early warning signals", "Correlate trend changes with known business events"],
  };
}

// --- Bivariate & Multivariate ---

export function generateCorrelationInsight(strongPairsCount: number, maxCorr: number, maxPairNames: string): AIInsight {
  const confidence = strongPairsCount < 3 ? "High" : "Medium";
  const insight = strongPairsCount === 0
    ? "No strong correlations (|r| > 0.7) found between variables. Features appear to be largely independent."
    : `Found ${strongPairsCount} strongly correlated pairs (|r| > 0.7). Strongest: ${maxPairNames} (r = ${maxCorr.toFixed(3)}). Consider feature selection.`;
  return {
    insight, confidence,
    recommendations: strongPairsCount > 0
      ? ["Remove or combine highly correlated features to reduce multicollinearity", "Use PCA or factor analysis to create orthogonal features", "Keep the feature with stronger business interpretability"]
      : ["Feature independence is good — all features can be used in modeling"],
  };
}

export function generateScatterPlotInsight(avgR2: number, strongRelCount: number): AIInsight {
  const confidence = avgR2 > 0.3 ? "High" : "Medium";
  const insight = strongRelCount > 0
    ? `${strongRelCount} variable pairs show meaningful linear relationships (R² > 0.3). Average R² across all pairs is ${avgR2.toFixed(3)}.`
    : `No strong linear relationships detected (average R² = ${avgR2.toFixed(3)}). Consider non-linear modeling approaches.`;
  return {
    insight, confidence,
    recommendations: avgR2 < 0.2
      ? ["Explore non-linear transformations (polynomial, log) for better fits", "Consider interaction terms between variables"]
      : ["Linear relationships are present — regression models should perform well"],
  };
}

export function generateMulticollinearityInsight(highVifCount: number, maxVif: number, maxVifName: string): AIInsight {
  const confidence = highVifCount === 0 ? "High" : highVifCount < 3 ? "Medium" : "Low";
  const insight = highVifCount === 0
    ? "No multicollinearity issues detected (all VIF < 5). Spend variables are sufficiently independent for regression."
    : `${highVifCount} spend variables show elevated VIF values. ${maxVifName} has the highest VIF at ${maxVif.toFixed(1)}, indicating redundancy.`;
  return {
    insight, confidence,
    recommendations: highVifCount > 0
      ? ["Consider removing or combining variables with VIF > 10", "Use ridge regression to handle multicollinearity", "Apply PCA to create orthogonal spend features"]
      : ["Multicollinearity is low — OLS regression is appropriate"],
  };
}

export function generatePCAInsight(varianceExplained: number[], componentsFor80: number, totalVars: number): AIInsight {
  const confidence = componentsFor80 < totalVars * 0.5 ? "High" : "Medium";
  const firstPCpct = (varianceExplained[0] * 100).toFixed(1);
  const insight = `First principal component explains ${firstPCpct}% of variance. ${componentsFor80} components needed to capture 80% of total variance (from ${totalVars} original features).`;
  return {
    insight, confidence,
    recommendations: componentsFor80 < totalVars * 0.5
      ? ["Dimensionality reduction is feasible — data has strong latent structure", `Use ${componentsFor80} principal components to reduce noise while retaining information`]
      : ["Data has high intrinsic dimensionality — PCA reduction may lose important signal", "Consider feature selection over PCA for better interpretability"],
  };
}

export function generateClusteringInsight(k: number, silhouetteScore: number): AIInsight {
  const confidence = silhouetteScore > 0.5 ? "High" : silhouetteScore > 0.3 ? "Medium" : "Low";
  const insight = silhouetteScore > 0.5
    ? `K-means with k=${k} reveals well-separated clusters (silhouette score: ${silhouetteScore.toFixed(3)}). Data has natural grouping structure.`
    : `Clustering with k=${k} shows moderate separation (silhouette: ${silhouetteScore.toFixed(3)}). Groups overlap significantly.`;
  return {
    insight, confidence,
    recommendations: silhouetteScore > 0.3
      ? ["Use cluster assignments as features in downstream models", "Analyze cluster centroids for business segment characteristics"]
      : ["Try different k values or alternative clustering algorithms", "Data may not have strong natural clusters — consider continuous models instead"],
  };
}

// --- Time Series ---

export function generateTrendDecompositionInsight(trendDirection: "up" | "down" | "flat", seasonalStrength: number): AIInsight {
  const confidence: AIInsight["confidence"] = "High";
  const trendText = trendDirection === "up" ? "upward" : trendDirection === "down" ? "downward" : "flat";
  const seasonText = seasonalStrength > 0.3 ? "strong" : seasonalStrength > 0.1 ? "moderate" : "weak";
  const insight = `Time series shows a ${trendText} trend with ${seasonText} seasonality (strength: ${(seasonalStrength * 100).toFixed(0)}%). Residuals represent unexplained short-term variation.`;
  return {
    insight, confidence,
    recommendations: [
      seasonalStrength > 0.1 ? "Account for seasonality in forecasting models" : "Seasonality is minimal — simpler trend models may suffice",
      trendDirection !== "flat" ? "Include trend component in baseline forecasts" : "Stationary trend suggests mean-reverting behavior",
    ],
  };
}

export function generateSeasonalityInsight(period: number, strength: number): AIInsight {
  const confidence = strength > 0.2 ? "High" : "Medium";
  const periodLabel = period <= 7 ? "weekly" : period <= 30 ? "monthly" : "quarterly";
  const insight = strength > 0.2
    ? `Detected ${periodLabel} seasonality with period of ${period} observations (strength: ${(strength * 100).toFixed(0)}%). Pattern is consistent across the dataset.`
    : `Weak seasonal patterns detected (strength: ${(strength * 100).toFixed(0)}%). The ${periodLabel} cycle explains minimal variance.`;
  return {
    insight, confidence,
    recommendations: strength > 0.2
      ? ["Use SARIMA or Prophet with seasonal period for forecasting", "De-seasonalize data before testing for trends or structural breaks"]
      : ["Seasonal adjustment is optional given weak patterns", "Consider external regressors instead of seasonal dummies"],
  };
}

export function generateStationarityInsight(stationaryCount: number, totalCount: number): AIInsight {
  const confidence = stationaryCount > totalCount * 0.5 ? "High" : "Medium";
  const insight = stationaryCount === totalCount
    ? `All ${totalCount} time series are stationary (ADF test, p < 0.05). No differencing required for modeling.`
    : `${stationaryCount} of ${totalCount} series are stationary. ${totalCount - stationaryCount} require differencing to achieve stationarity.`;
  return {
    insight, confidence,
    recommendations: stationaryCount < totalCount
      ? ["Apply first-order differencing to non-stationary series", "Use ARIMA(p,1,q) for non-stationary series", "Check if non-stationarity is due to trend, seasonality, or both"]
      : ["Stationary series are ready for ARMA-type models"],
  };
}

export function generateACFPACFInsight(significantLags: number, suggestedP: number, suggestedQ: number): AIInsight {
  const confidence = significantLags < 5 ? "High" : "Medium";
  const insight = significantLags === 0
    ? "No significant autocorrelation detected. Series may be white noise or require different modeling approach."
    : `${significantLags} significant lags detected. ACF/PACF patterns suggest ARIMA(${suggestedP},d,${suggestedQ}) as starting model.`;
  return {
    insight, confidence,
    recommendations: significantLags > 0
      ? [`Start with ARIMA(${suggestedP},d,${suggestedQ}) and refine using AIC/BIC`, "Check residual ACF after fitting to verify model adequacy"]
      : ["Consider external regressors or non-linear models", "Verify data is not overdifferenced"],
  };
}

export function generateChangePointInsight(changePoints: number, totalObs: number): AIInsight {
  const confidence = changePoints < 3 ? "High" : "Medium";
  const insight = changePoints === 0
    ? `No structural breaks detected across ${totalObs} observations. The data generating process appears stable.`
    : `${changePoints} structural break${changePoints > 1 ? "s" : ""} detected in the time series. These may correspond to market shifts, campaigns, or external events.`;
  return {
    insight, confidence,
    recommendations: changePoints > 0
      ? ["Investigate change points against known business events (campaigns, policy changes)", "Consider regime-switching models for data with structural breaks", "Split data at change points for separate model fitting"]
      : ["Stable data supports single-model approaches"],
  };
}

// --- Outlier & Anomaly Detection ---

export function generateOutlierInsight(totalOutliers: number, varsWithOutliers: number, totalVars: number): AIInsight {
  const confidence = varsWithOutliers < totalVars * 0.3 ? "High" : "Medium";
  const insight = totalOutliers === 0
    ? `No IQR-based outliers detected across ${totalVars} variables. All values fall within expected ranges.`
    : `${totalOutliers} outliers found across ${varsWithOutliers} of ${totalVars} variables. Most are mild outliers within 3x IQR range.`;
  return {
    insight, confidence,
    recommendations: totalOutliers > 0
      ? ["Validate outliers against business context before removal", "Use robust regression (Huber loss) to reduce outlier influence", "Consider winsorization at 1st/99th percentiles"]
      : ["Data is clean — standard methods can be used without outlier treatment"],
  };
}

export function generateTimeSeriesAnomalyInsight(anomalyCount: number, totalObs: number): AIInsight {
  const anomalyRate = totalObs > 0 ? (anomalyCount / totalObs) * 100 : 0;
  const confidence = anomalyRate < 5 ? "High" : "Medium";
  const insight = anomalyCount === 0
    ? `No time series anomalies detected. All observations fall within the expected confidence band.`
    : `${anomalyCount} anomalous observations detected (${anomalyRate.toFixed(1)}% of data). These represent significant deviations from expected patterns.`;
  return {
    insight, confidence,
    recommendations: anomalyCount > 0
      ? ["Cross-reference anomalies with campaign launches or market events", "Consider whether anomalies should be adjusted or kept for modeling"]
      : ["Time series behavior is consistent — good for forecasting"],
  };
}

export function generateSpendAnomalyInsight(anomalyChannels: number, totalChannels: number): AIInsight {
  const confidence = anomalyChannels < totalChannels * 0.3 ? "High" : "Medium";
  const insight = anomalyChannels === 0
    ? `No spend anomalies detected across ${totalChannels} channels. Budget allocation has been consistent.`
    : `${anomalyChannels} of ${totalChannels} channels show spend anomalies — sudden spikes or drops that deviate from normal patterns.`;
  return {
    insight, confidence,
    recommendations: anomalyChannels > 0
      ? ["Verify spend anomalies with finance team — could be planned tests or errors", "Account for spend anomalies when calculating ROI/ROAS metrics"]
      : ["Spend patterns are stable — suitable for budget optimization models"],
  };
}

export function generateOutlierImpactInsight(avgPctChange: number): AIInsight {
  const confidence = Math.abs(avgPctChange) < 5 ? "High" : "Medium";
  const insight = Math.abs(avgPctChange) < 2
    ? `Removing outliers has minimal impact (avg ${avgPctChange.toFixed(1)}% change in means). Models should be robust to outlier treatment choice.`
    : `Outlier removal changes means by an average of ${Math.abs(avgPctChange).toFixed(1)}%. This indicates outliers are influential on aggregate statistics.`;
  return {
    insight, confidence,
    recommendations: Math.abs(avgPctChange) > 5
      ? ["Run models with and without outliers to assess sensitivity", "Use trimmed means or median as robust central tendency measures"]
      : ["Outlier impact is minimal — standard methods are reliable"],
  };
}

// --- Marketing AI Insights ---

export function generateSpendResponseInsight(saturatedChannels: number, totalChannels: number): AIInsight {
  const confidence: AIInsight["confidence"] = "Medium";
  const insight = saturatedChannels > 0
    ? `${saturatedChannels} of ${totalChannels} channels show diminishing returns at current spend levels. Marginal efficiency is declining for these channels.`
    : `No channels appear saturated at current spend levels. There may be room to increase investment across all channels.`;
  return {
    insight, confidence,
    recommendations: saturatedChannels > 0
      ? ["Reallocate budget from saturated to unsaturated channels", "Test incremental spend increases in unsaturated channels", "Consider geographic or audience expansion for saturated channels"]
      : ["Current spend levels are within the efficient range", "Gradually test higher spend levels to find saturation points"],
  };
}

export function generateChannelContributionInsight(topChannel: string, topPct: number): AIInsight {
  const confidence: AIInsight["confidence"] = "Medium";
  const insight = topPct > 40
    ? `${topChannel} dominates contribution at ${topPct.toFixed(1)}%. High channel concentration creates risk if this channel underperforms.`
    : `Contributions are well-distributed. ${topChannel} leads at ${topPct.toFixed(1)}%, indicating a diversified channel mix.`;
  return {
    insight, confidence,
    recommendations: topPct > 40
      ? ["Diversify budget across channels to reduce concentration risk", `Test reducing ${topChannel} spend by 10-15% to measure true incremental impact`]
      : ["Channel diversification is healthy", "Optimize allocation using marginal return curves"],
  };
}

export function generateFeatureImportanceInsight(topFeature: string, topScore: number, featureCount: number): AIInsight {
  const confidence: AIInsight["confidence"] = "Medium";
  const insight = topScore > 0.5
    ? `${topFeature} is the dominant predictor (importance: ${topScore.toFixed(3)}). Top 3 features explain the majority of variance.`
    : `Feature importance is distributed across ${featureCount} variables. ${topFeature} leads at ${topScore.toFixed(3)} but no single feature dominates.`;
  return {
    insight, confidence,
    recommendations: [
      `Focus optimization efforts on top features for maximum impact`,
      "Consider dropping features with near-zero importance to reduce model complexity",
    ],
  };
}

export function generateAdstockInsight(avgDecay: number, avgHalfLife: number): AIInsight {
  const confidence: AIInsight["confidence"] = "Medium";
  const insight = avgHalfLife > 3
    ? `Average ad effect half-life is ${avgHalfLife.toFixed(1)} periods (decay rate: ${avgDecay.toFixed(3)}). Advertising has lasting carryover effects in this market.`
    : `Short carryover effects detected (half-life: ${avgHalfLife.toFixed(1)} periods). Ad impact dissipates quickly — consistent presence is important.`;
  return {
    insight, confidence,
    recommendations: avgHalfLife > 3
      ? ["Use adstock-transformed variables in MMM for accurate attribution", "Space out campaigns to leverage carryover effects"]
      : ["Maintain consistent ad presence due to rapid decay", "Focus on high-frequency touchpoints for maximum recall"],
  };
}

export function generateKeyFindingsInsight(findingCount: number): AIInsight {
  return {
    insight: `${findingCount} key findings were identified from the comprehensive EDA. Review the summary below for actionable insights prioritized by impact.`,
    confidence: "High",
    recommendations: ["Address high-severity findings first", "Share this summary with stakeholders for alignment on data quality"],
  };
}
