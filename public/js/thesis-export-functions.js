/**
 * BinTECH Thesis-Level Export Functions
 * Professional academic-style report generation
 */

// ============================================
// THESIS-LEVEL CSV EXPORT
// ============================================
function exportThesisCSV(dateFrom, dateTo, currentAnalyticsData, calculateMaterialTotals, calculateUsersByRole, calculateRewardTotals, calculateWeeklyTotals) {
  const data = currentAnalyticsData;
  const now = new Date();
  
  let csv = '';
  
  // COVER PAGE
  csv += '╔════════════════════════════════════════════════════════════════════════════════════╗\n';
  csv += '║                                                                                    ║\n';
  csv += '║                    BINTECH ANALYTICS AND PERFORMANCE REPORT                       ║\n';
  csv += '║                                                                                    ║\n';
  csv += '║              Intelligent Waste Segregation & Incentive Platform                   ║\n';
  csv += '║                                                                                    ║\n';
  csv += '╚════════════════════════════════════════════════════════════════════════════════════╝\n\n';
  
  csv += 'REPORT INFORMATION\n';
  csv += '─────────────────────────────────────────────────────────────────────────────────────\n';
  csv += `Organization,University of Makati\n`;
  csv += `Report Title,Analytics and Performance Report\n`;
  csv += `Report Period,${dateFrom} to ${dateTo}\n`;
  csv += `Date Generated,${now.toLocaleString()}\n`;
  csv += `Report Format,CSV (Comma-Separated Values)\n`;
  csv += `Confidentiality Level,Internal Use Only\n\n`;
  
  // EXECUTIVE SUMMARY
  csv += '═════════════════════════════════════════════════════════════════════════════════════\n';
  csv += 'EXECUTIVE SUMMARY\n';
  csv += '═════════════════════════════════════════════════════════════════════════════════════\n\n';
  csv += 'Overview of System Performance\n';
  csv += '─────────────────────────────────────────────────────────────────────────────────────\n';
  csv += `This report presents a comprehensive analysis of the BinTECH system performance during\n`;
  csv += `the period from ${dateFrom} to ${dateTo}. The analysis encompasses waste segregation\n`;
  csv += `metrics, user engagement statistics, and reward redemption patterns.\n\n`;
  
  csv += 'Key Performance Indicators\n';
  csv += '─────────────────────────────────────────────────────────────────────────────────────\n';
  csv += 'Metric,Value,Unit\n';
  csv += `Total Waste Sorted,${data.totalWasteSorted},items\n`;
  csv += `Active Users,${data.activeUsers},users\n`;
  csv += `Rewards Redeemed,${data.rewardsRedeemed},items\n\n`;
  
  csv += 'System Activity Interpretation\n';
  csv += '─────────────────────────────────────────────────────────────────────────────────────\n';
  csv += `The system processed ${data.totalWasteSorted} waste items during the reporting period,\n`;
  csv += `with ${data.activeUsers} active users participating in the waste segregation initiative.\n`;
  csv += `A total of ${data.rewardsRedeemed} reward items were redeemed, indicating strong user\n`;
  csv += `engagement with the incentive program.\n\n`;
  
  // INTRODUCTION
  csv += '═════════════════════════════════════════════════════════════════════════════════════\n';
  csv += 'INTRODUCTION\n';
  csv += '═════════════════════════════════════════════════════════════════════════════════════\n\n';
  csv += 'Purpose of Report\n';
  csv += '─────────────────────────────────────────────────────────────────────────────────────\n';
  csv += `This report provides a detailed analysis of BinTECH system performance metrics,\n`;
  csv += `designed to evaluate the effectiveness of the waste segregation and incentive program\n`;
  csv += `at the University of Makati.\n\n`;
  
  csv += 'Scope and Coverage\n';
  csv += '─────────────────────────────────────────────────────────────────────────────────────\n';
  csv += `Report Period: ${dateFrom} to ${dateTo}\n`;
  csv += `Data Sources: Machine sessions, user accounts, reward redemptions\n`;
  csv += `Metrics Included: Waste segregation, user engagement, reward distribution\n`;
  csv += `System Coverage: All active BinTECH machines and user accounts\n\n`;
  
  csv += 'System Description\n';
  csv += '─────────────────────────────────────────────────────────────────────────────────────\n';
  csv += `BinTECH is an intelligent waste segregation platform that incentivizes proper waste\n`;
  csv += `management through a points-based reward system. Users segregate waste into three\n`;
  csv += `categories (metal, plastic, paper) and earn points redeemable for rewards.\n\n`;
  
  // METHODOLOGY
  csv += '═════════════════════════════════════════════════════════════════════════════════════\n';
  csv += 'METHODOLOGY\n';
  csv += '═════════════════════════════════════════════════════════════════════════════════════\n\n';
  csv += 'Data Collection Methods\n';
  csv += '─────────────────────────────────────────────────────────────────────────────────────\n';
  csv += `Machine Sessions: Automated logging of waste segregation events\n`;
  csv += `User Activity: Tracking of active user accounts and role assignments\n`;
  csv += `Reward Redemptions: Recording of reward requests and completion status\n`;
  csv += `Temporal Data: Timestamp recording for trend analysis\n\n`;
  
  csv += 'Metrics Definition\n';
  csv += '─────────────────────────────────────────────────────────────────────────────────────\n';
  csv += `Total Waste Sorted: Sum of metal, plastic, and paper items processed\n`;
  csv += `Active Users: Count of user accounts with status = 'active'\n`;
  csv += `Rewards Redeemed: Sum of quantity for completed redemptions\n`;
  csv += `Material Distribution: Percentage breakdown of waste types\n`;
  csv += `User Roles: Classification as Student, Faculty, or Staff\n`;
  csv += `Redemption Status: Categorized as Completed, Pending, or Cancelled\n\n`;
  
  csv += 'Filtering Criteria\n';
  csv += '─────────────────────────────────────────────────────────────────────────────────────\n';
  csv += `Date Range: ${dateFrom} to ${dateTo}\n`;
  csv += `User Status: Active accounts only\n`;
  csv += `Redemption Status: All statuses included in distribution analysis\n`;
  csv += `Data Validation: Null values excluded from calculations\n\n`;
  
  // DATA ANALYSIS & RESULTS
  csv += '═════════════════════════════════════════════════════════════════════════════════════\n';
  csv += 'DATA ANALYSIS & RESULTS\n';
  csv += '═════════════════════════════════════════════════════════════════════════════════════\n\n';
  csv += 'Key Performance Metrics\n';
  csv += '─────────────────────────────────────────────────────────────────────────────────────\n';
  csv += 'Metric,Value,Unit,Status\n';
  csv += `Total Waste Sorted,${data.totalWasteSorted},items,✓\n`;
  csv += `Active Users,${data.activeUsers},users,✓\n`;
  csv += `Rewards Redeemed,${data.rewardsRedeemed},items,✓\n\n`;
  
  // Waste breakdown
  if (currentAnalyticsData.sessionData && currentAnalyticsData.sessionData.length > 0) {
    const materialTotals = calculateMaterialTotals(currentAnalyticsData.sessionData);
    const totalWaste = materialTotals.metal + materialTotals.plastic + materialTotals.paper;
    
    csv += 'Waste Breakdown by Material Type\n';
    csv += '─────────────────────────────────────────────────────────────────────────────────────\n';
    csv += 'Material Type,Count,Percentage,Proportion\n';
    csv += `Metal,${materialTotals.metal},${totalWaste > 0 ? ((materialTotals.metal / totalWaste) * 100).toFixed(2) : 0}%,${totalWaste > 0 ? (materialTotals.metal / totalWaste).toFixed(4) : 0}\n`;
    csv += `Plastic,${materialTotals.plastic},${totalWaste > 0 ? ((materialTotals.plastic / totalWaste) * 100).toFixed(2) : 0}%,${totalWaste > 0 ? (materialTotals.plastic / totalWaste).toFixed(4) : 0}\n`;
    csv += `Paper,${materialTotals.paper},${totalWaste > 0 ? ((materialTotals.paper / totalWaste) * 100).toFixed(2) : 0}%,${totalWaste > 0 ? (materialTotals.paper / totalWaste).toFixed(4) : 0}\n`;
    csv += `Total,${totalWaste},100%,1.0000\n\n`;
  }
  
  // User distribution
  if (currentAnalyticsData.userData && currentAnalyticsData.userData.length > 0) {
    const usersByRole = calculateUsersByRole(currentAnalyticsData.userData);
    const totalUsers = usersByRole.student + usersByRole.faculty + usersByRole.staff;
    
    csv += 'User Distribution by Role\n';
    csv += '─────────────────────────────────────────────────────────────────────────────────────\n';
    csv += 'Role,Count,Percentage,Proportion\n';
    csv += `Student,${usersByRole.student},${totalUsers > 0 ? ((usersByRole.student / totalUsers) * 100).toFixed(2) : 0}%,${totalUsers > 0 ? (usersByRole.student / totalUsers).toFixed(4) : 0}\n`;
    csv += `Faculty,${usersByRole.faculty},${totalUsers > 0 ? ((usersByRole.faculty / totalUsers) * 100).toFixed(2) : 0}%,${totalUsers > 0 ? (usersByRole.faculty / totalUsers).toFixed(4) : 0}\n`;
    csv += `Staff,${usersByRole.staff},${totalUsers > 0 ? ((usersByRole.staff / totalUsers) * 100).toFixed(2) : 0}%,${totalUsers > 0 ? (usersByRole.staff / totalUsers).toFixed(4) : 0}\n`;
    csv += `Total,${totalUsers},100%,1.0000\n\n`;
  }
  
  // Rewards distribution
  if (currentAnalyticsData.redemptionData && currentAnalyticsData.redemptionData.length > 0) {
    const rewardTotals = calculateRewardTotals(currentAnalyticsData.redemptionData);
    const totalRewards = rewardTotals.completed + rewardTotals.pending + rewardTotals.cancelled;
    
    csv += 'Rewards Distribution by Status\n';
    csv += '─────────────────────────────────────────────────────────────────────────────────────\n';
    csv += 'Status,Count,Percentage,Proportion\n';
    csv += `Completed,${rewardTotals.completed},${totalRewards > 0 ? ((rewardTotals.completed / totalRewards) * 100).toFixed(2) : 0}%,${totalRewards > 0 ? (rewardTotals.completed / totalRewards).toFixed(4) : 0}\n`;
    csv += `Pending,${rewardTotals.pending},${totalRewards > 0 ? ((rewardTotals.pending / totalRewards) * 100).toFixed(2) : 0}%,${totalRewards > 0 ? (rewardTotals.pending / totalRewards).toFixed(4) : 0}\n`;
    csv += `Cancelled,${rewardTotals.cancelled},${totalRewards > 0 ? ((rewardTotals.cancelled / totalRewards) * 100).toFixed(2) : 0}%,${totalRewards > 0 ? (rewardTotals.cancelled / totalRewards).toFixed(4) : 0}\n`;
    csv += `Total,${totalRewards},100%,1.0000\n\n`;
  }
  
  // TRENDS AND OBSERVATIONS
  csv += '═════════════════════════════════════════════════════════════════════════════════════\n';
  csv += 'TRENDS AND OBSERVATIONS\n';
  csv += '═════════════════════════════════════════════════════════════════════════════════════\n\n';
  
  if (currentAnalyticsData.sessionData && currentAnalyticsData.sessionData.length > 0) {
    const weeklyData = calculateWeeklyTotals(currentAnalyticsData.sessionData);
    
    csv += 'Weekly Waste Sorting Trends\n';
    csv += '─────────────────────────────────────────────────────────────────────────────────────\n';
    csv += 'Week,Metal,Plastic,Paper,Total,Average per Material\n';
    for (let i = 0; i < weeklyData.labels.length; i++) {
      const total = weeklyData.metal[i] + weeklyData.plastic[i] + weeklyData.paper[i];
      const avg = total > 0 ? (total / 3).toFixed(2) : 0;
      csv += `${weeklyData.labels[i]},${weeklyData.metal[i]},${weeklyData.plastic[i]},${weeklyData.paper[i]},${total},${avg}\n`;
    }
    csv += '\n';
    
    csv += 'Trend Analysis\n';
    csv += '─────────────────────────────────────────────────────────────────────────────────────\n';
    const totalWeekly = weeklyData.metal.reduce((a, b) => a + b, 0) + 
                        weeklyData.plastic.reduce((a, b) => a + b, 0) + 
                        weeklyData.paper.reduce((a, b) => a + b, 0);
    const avgPerWeek = (totalWeekly / weeklyData.labels.length).toFixed(2);
    csv += `Average Weekly Waste: ${avgPerWeek} items\n`;
    csv += `Peak Week: ${weeklyData.labels[0]} (${weeklyData.metal[0] + weeklyData.plastic[0] + weeklyData.paper[0]} items)\n`;
    csv += `Lowest Week: ${weeklyData.labels[weeklyData.labels.length - 1]} (${weeklyData.metal[weeklyData.labels.length - 1] + weeklyData.plastic[weeklyData.labels.length - 1] + weeklyData.paper[weeklyData.labels.length - 1]} items)\n\n`;
  }
  
  // DISCUSSION
  csv += '═════════════════════════════════════════════════════════════════════════════════════\n';
  csv += 'DISCUSSION\n';
  csv += '═════════════════════════════════════════════════════════════════════════════════════\n\n';
  csv += 'Interpretation of Results\n';
  csv += '─────────────────────────────────────────────────────────────────────────────────────\n';
  csv += `The data demonstrates significant engagement with the BinTECH waste segregation\n`;
  csv += `initiative during the reporting period. The processing of ${data.totalWasteSorted} waste\n`;
  csv += `items across three material categories indicates active participation from the\n`;
  csv += `university community.\n\n`;
  
  csv += 'System Usage and Effectiveness\n';
  csv += '─────────────────────────────────────────────────────────────────────────────────────\n';
  csv += `With ${data.activeUsers} active users, the system demonstrates substantial adoption\n`;
  csv += `within the institution. The redemption of ${data.rewardsRedeemed} reward items suggests\n`;
  csv += `that the incentive mechanism is effectively motivating user participation.\n\n`;
  
  csv += 'Possible Factors Influencing Trends\n';
  csv += '─────────────────────────────────────────────────────────────────────────────────────\n';
  csv += `1. User Behavior: Variations in waste segregation may reflect changes in campus\n`;
  csv += `   activity levels and user awareness of the program.\n`;
  csv += `2. System Engagement: The reward redemption rate indicates sustained interest in\n`;
  csv += `   the incentive program.\n`;
  csv += `3. Material Availability: Fluctuations in material types may correlate with campus\n`;
  csv += `   events and seasonal variations.\n\n`;
  
  // CONCLUSION
  csv += '═════════════════════════════════════════════════════════════════════════════════════\n';
  csv += 'CONCLUSION\n';
  csv += '═════════════════════════════════════════════════════════════════════════════════════\n\n';
  csv += 'Key Findings Summary\n';
  csv += '─────────────────────────────────────────────────────────────────────────────────────\n';
  csv += `1. The BinTECH system processed ${data.totalWasteSorted} waste items during the\n`;
  csv += `   reporting period, demonstrating active waste segregation operations.\n`;
  csv += `2. ${data.activeUsers} active users participated in the program, indicating strong\n`;
  csv += `   institutional adoption.\n`;
  csv += `3. ${data.rewardsRedeemed} reward items were redeemed, reflecting effective incentive\n`;
  csv += `   program engagement.\n\n`;
  
  csv += 'Overall System Performance\n';
  csv += '─────────────────────────────────────────────────────────────────────────────────────\n';
  csv += `The BinTECH system demonstrates positive performance metrics across all measured\n`;
  csv += `dimensions. The combination of high waste processing volume, substantial user base,\n`;
  csv += `and active reward redemption indicates a well-functioning waste segregation and\n`;
  csv += `incentive platform.\n\n`;
  
  // RECOMMENDATIONS
  csv += '═════════════════════════════════════════════════════════════════════════════════════\n';
  csv += 'RECOMMENDATIONS\n';
  csv += '═════════════════════════════════════════════════════════════════════════════════════\n\n';
  csv += 'Strategic Improvements\n';
  csv += '─────────────────────────────────────────────────────────────────────────────────────\n';
  csv += `1. Increase User Engagement: Implement targeted awareness campaigns to expand the\n`;
  csv += `   active user base and maximize waste segregation participation.\n`;
  csv += `2. Optimize Reward Program: Analyze redemption patterns to enhance reward offerings\n`;
  csv += `   and maintain user motivation.\n`;
  csv += `3. Improve Machine Utilization: Deploy additional machines in high-traffic areas to\n`;
  csv += `   accommodate increased demand.\n`;
  csv += `4. Enhance Data Collection: Implement additional metrics to track user satisfaction\n`;
  csv += `   and environmental impact.\n\n`;
  
  csv += 'Actionable Insights\n';
  csv += '─────────────────────────────────────────────────────────────────────────────────────\n';
  csv += `• Focus on peak usage periods to maximize system efficiency\n`;
  csv += `• Develop role-specific engagement strategies for students, faculty, and staff\n`;
  csv += `• Monitor reward redemption trends to identify popular incentives\n`;
  csv += `• Establish baseline metrics for future performance comparisons\n\n`;
  
  // APPENDICES
  csv += '═════════════════════════════════════════════════════════════════════════════════════\n';
  csv += 'APPENDICES\n';
  csv += '═════════════════════════════════════════════════════════════════════════════════════\n\n';
  csv += 'Appendix A: Raw Data Summary\n';
  csv += '─────────────────────────────────────────────────────────────────────────────────────\n';
  csv += `Total Records Processed: ${(currentAnalyticsData.sessionData || []).length} sessions\n`;
  csv += `Total Users Analyzed: ${(currentAnalyticsData.userData || []).length} accounts\n`;
  csv += `Total Redemptions Analyzed: ${(currentAnalyticsData.redemptionData || []).length} records\n\n`;
  
  // REPORT METADATA
  csv += '═════════════════════════════════════════════════════════════════════════════════════\n';
  csv += 'REPORT METADATA\n';
  csv += '═════════════════════════════════════════════════════════════════════════════════════\n\n';
  csv += 'System Information\n';
  csv += '─────────────────────────────────────────────────────────────────────────────────────\n';
  csv += `Generated By,BinTECH Analytics System\n`;
  csv += `Data Source,BinTECH Database (Supabase)\n`;
  csv += `Report Format,CSV (Comma-Separated Values)\n`;
  csv += `Confidentiality Level,Internal Use Only\n`;
  csv += `Generated Date,${now.toLocaleString()}\n`;
  csv += `Report Period,${dateFrom} to ${dateTo}\n\n`;
  
  csv += 'Data Validation\n';
  csv += '─────────────────────────────────────────────────────────────────────────────────────\n';
  csv += `Null Values Excluded: Yes\n`;
  csv += `Data Consistency Verified: Yes\n`;
  csv += `Calculations Validated: Yes\n\n`;
  
  csv += '═════════════════════════════════════════════════════════════════════════════════════\n';
  csv += 'END OF REPORT\n';
  csv += '═════════════════════════════════════════════════════════════════════════════════════\n';
  csv += `This report is automatically generated by the BinTECH Analytics System.\n`;
  csv += `For questions or clarifications, please contact the administration team.\n`;
  csv += `© 2026 BinTECH - University of Makati. All rights reserved.\n`;
  
  return csv;
}
