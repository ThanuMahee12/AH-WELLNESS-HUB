/**
 * Utility functions for business calculations
 * Centralizes revenue, commission, and statistics calculations
 */

/**
 * Calculate commission for a single test
 * @param {number} price - Test price
 * @param {number} percentage - Commission percentage (default: 20)
 * @returns {number} Commission amount
 */
export const calculateTestCommission = (price, percentage = 20) => {
  if (!price || price <= 0) return 0;
  return (price * (percentage || 20)) / 100;
};

/**
 * Calculate total commission for a checkup
 * @param {Object} checkup - Checkup object with tests array
 * @param {Array} testsData - Array of all test definitions
 * @returns {number} Total commission for the checkup
 */
export const calculateCheckupCommission = (checkup, testsData = []) => {
  if (!checkup?.tests || !Array.isArray(checkup.tests)) return 0;

  return checkup.tests.reduce((sum, testItem) => {
    const test = testsData.find(t => t.id === testItem.testId);
    if (test) {
      const commission = calculateTestCommission(test.price, test.percentage);
      return sum + commission;
    }
    return sum;
  }, 0);
};

/**
 * Calculate total revenue from checkups
 * @param {Array} checkups - Array of checkup objects
 * @returns {number} Total revenue
 */
export const calculateTotalRevenue = (checkups = []) => {
  return checkups.reduce((sum, checkup) => sum + (checkup.total || 0), 0);
};

/**
 * Calculate total commission from checkups
 * @param {Array} checkups - Array of checkup objects
 * @param {Array} testsData - Array of all test definitions
 * @returns {number} Total commission
 */
export const calculateTotalCommission = (checkups = [], testsData = []) => {
  return checkups.reduce((sum, checkup) => {
    return sum + calculateCheckupCommission(checkup, testsData);
  }, 0);
};

/**
 * Calculate average bill amount
 * @param {Array} checkups - Array of checkup objects
 * @returns {number} Average bill amount
 */
export const calculateAverageBill = (checkups = []) => {
  if (!checkups.length) return 0;
  const total = calculateTotalRevenue(checkups);
  return total / checkups.length;
};

/**
 * Get highest bill amount from checkups
 * @param {Array} checkups - Array of checkup objects
 * @returns {number} Highest bill amount
 */
export const getHighestBill = (checkups = []) => {
  if (!checkups.length) return 0;
  return Math.max(...checkups.map(c => c.total || 0));
};

/**
 * Filter checkups by date range
 * @param {Array} checkups - Array of checkup objects
 * @param {number} days - Number of days to look back
 * @returns {Array} Filtered checkups
 */
export const filterCheckupsByDateRange = (checkups = [], days = 7) => {
  const now = new Date();
  const startDate = new Date();
  startDate.setDate(now.getDate() - days);

  return checkups.filter(checkup => {
    const checkupDate = new Date(checkup.timestamp);
    return checkupDate >= startDate && checkupDate <= now;
  });
};

/**
 * Filter checkups by performance range
 * @param {Array} checkups - Array of checkup objects
 * @param {string} range - Range type: 'today', 'yesterday', 'week', 'month', 'year'
 * @returns {Array} Filtered checkups
 */
export const filterCheckupsByPerformanceRange = (checkups = [], range = 'today') => {
  const now = new Date();

  switch (range) {
    case 'today':
      return checkups.filter(c =>
        new Date(c.timestamp).toDateString() === now.toDateString()
      );

    case 'yesterday': {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return checkups.filter(c =>
        new Date(c.timestamp).toDateString() === yesterday.toDateString()
      );
    }

    case 'week': {
      const startOfWeek = new Date();
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return checkups.filter(c => {
        const date = new Date(c.timestamp);
        return date >= startOfWeek && date <= now;
      });
    }

    case 'month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return checkups.filter(c => {
        const date = new Date(c.timestamp);
        return date >= startOfMonth && date <= now;
      });
    }

    case 'year': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return checkups.filter(c => {
        const date = new Date(c.timestamp);
        return date >= startOfYear && date <= now;
      });
    }

    default:
      return [];
  }
};

/**
 * Get chart data for date range
 * @param {Array} checkups - Array of checkup objects
 * @param {Array} testsData - Array of all test definitions
 * @param {number} days - Number of days
 * @returns {Array} Chart data array
 */
export const getDateRangeChartData = (checkups = [], testsData = [], days = 7) => {
  const data = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    const dayCheckups = checkups.filter(c =>
      new Date(c.timestamp).toDateString() === date.toDateString()
    );

    const dayRevenue = calculateTotalRevenue(dayCheckups);
    const dayCommission = calculateTotalCommission(dayCheckups, testsData);

    data.push({
      date: dateStr,
      checkups: dayCheckups.length,
      revenue: dayRevenue,
      commission: dayCommission
    });
  }

  return data;
};

/**
 * Get monthly revenue data for a year
 * @param {Array} checkups - Array of checkup objects
 * @param {number} year - Year to get data for
 * @returns {Array} Monthly revenue data
 */
export const getMonthlyRevenueData = (checkups = [], year = new Date().getFullYear()) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const monthlyData = monthNames.map(month => ({ month, revenue: 0 }));

  checkups.forEach(checkup => {
    const date = new Date(checkup.timestamp);
    if (date.getFullYear() === year) {
      const monthIndex = date.getMonth();
      monthlyData[monthIndex].revenue += checkup.total || 0;
    }
  });

  return monthlyData.map(data => ({
    month: data.month,
    revenue: Math.round(data.revenue)
  }));
};

/**
 * Get test distribution data
 * @param {Array} checkups - Array of checkup objects
 * @param {Array} testsData - Array of all test definitions
 * @param {number} limit - Max number of tests to return
 * @returns {Array} Test distribution data
 */
export const getTestDistribution = (checkups = [], testsData = [], limit = 5) => {
  const testCounts = {};

  checkups.forEach(checkup => {
    checkup.tests?.forEach(testItem => {
      const test = testsData.find(t => t.id === testItem.testId);
      if (test) {
        testCounts[test.name] = (testCounts[test.name] || 0) + 1;
      }
    });
  });

  return Object.entries(testCounts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
};

/**
 * Get comparison period checkups for performance stats
 * @param {Array} checkups - Array of checkup objects
 * @param {string} range - Range type: 'today', 'yesterday', 'week', 'month', 'year'
 * @returns {Array} Comparison period checkups
 */
export const getComparisonCheckups = (checkups = [], range = 'today') => {
  const now = new Date();

  switch (range) {
    case 'today': {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      return checkups.filter(c =>
        new Date(c.timestamp).toDateString() === yesterday.toDateString()
      );
    }

    case 'yesterday': {
      const dayBefore = new Date();
      dayBefore.setDate(dayBefore.getDate() - 2);
      return checkups.filter(c =>
        new Date(c.timestamp).toDateString() === dayBefore.toDateString()
      );
    }

    case 'week': {
      const lastWeekStart = new Date();
      lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
      lastWeekStart.setHours(0, 0, 0, 0);
      const lastWeekEnd = new Date();
      lastWeekEnd.setDate(now.getDate() - now.getDay() - 1);
      lastWeekEnd.setHours(23, 59, 59, 999);
      return checkups.filter(c => {
        const date = new Date(c.timestamp);
        return date >= lastWeekStart && date <= lastWeekEnd;
      });
    }

    case 'month': {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return checkups.filter(c => {
        const date = new Date(c.timestamp);
        return date >= lastMonth && date <= lastMonthEnd;
      });
    }

    case 'year': {
      const lastYear = new Date(now.getFullYear() - 1, 0, 1);
      const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
      return checkups.filter(c => {
        const date = new Date(c.timestamp);
        return date >= lastYear && date <= lastYearEnd;
      });
    }

    default:
      return [];
  }
};

/**
 * Get year options from start year to current year
 * @param {number} startYear - Starting year
 * @returns {Array} Array of years
 */
export const getYearOptions = (startYear = 2025) => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = startYear; year <= currentYear; year++) {
    years.push(year);
  }
  return years;
};

/**
 * Get comparison label based on performance range
 * @param {string} range - Range type
 * @returns {string} Comparison label
 */
export const getComparisonLabel = (range) => {
  const labels = {
    today: 'Yesterday',
    yesterday: 'Day Before',
    week: 'Last Week',
    month: 'Last Month',
    year: 'Last Year'
  };
  return labels[range] || '';
};

export default {
  calculateTestCommission,
  calculateCheckupCommission,
  calculateTotalRevenue,
  calculateTotalCommission,
  calculateAverageBill,
  getHighestBill,
  filterCheckupsByDateRange,
  filterCheckupsByPerformanceRange,
  getComparisonCheckups,
  getDateRangeChartData,
  getMonthlyRevenueData,
  getTestDistribution,
  getYearOptions,
  getComparisonLabel
};
