import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { Row, Col, Card, ButtonGroup, Button, Table, Badge, Alert } from 'react-bootstrap'
import { FaHistory, FaCalendarAlt } from 'react-icons/fa'
import {
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ZAxis
} from 'recharts'
import { getActivityStats, getUserActivities } from '../../services/activityService'
import LoadingSpinner from '../../components/common/LoadingSpinner'

function UserActivityTab() {
  const { user: currentUser } = useSelector(state => state.auth)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('all') // Default: All history
  const [stats, setStats] = useState(null)
  const [recentActivities, setRecentActivities] = useState([])

  const isSuperAdmin = currentUser?.role === 'superadmin'

  useEffect(() => {
    loadActivityData()
  }, [timeRange])

  const loadActivityData = async () => {
    setLoading(true)
    try {
      // Get stats
      const statsResult = await getActivityStats(timeRange)
      if (statsResult.success) {
        setStats(statsResult.data)
      }

      // Get recent activities (limit to 20)
      const activitiesResult = await getUserActivities({ days: timeRange, limit: 20 })
      if (activitiesResult.success) {
        setRecentActivities(activitiesResult.data)
      }
    } catch (error) {
      console.error('Error loading activity data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Prepare scatter plot data - individual activities as separate points
  const prepareScatterData = () => {
    if (!recentActivities || recentActivities.length === 0) {
      return []
    }

    // Create scatter plot data grouped by user
    const userScatterData = {}

    stats?.userStats?.forEach(userStat => {
      userScatterData[userStat.username] = []
    })

    recentActivities.forEach(activity => {
      if (!activity.timestamp) return

      const date = activity.timestamp instanceof Date ? activity.timestamp : new Date(activity.timestamp)
      const dateKey = date.toISOString().split('T')[0]
      const hour = date.getHours()

      const d = new Date(dateKey)
      const displayDate = `${d.getMonth() + 1}/${d.getDate()}`

      // Find the user's data array
      const username = activity.username || 'Unknown'
      if (!userScatterData[username]) {
        userScatterData[username] = []
      }

      // Add each activity as individual point
      userScatterData[username].push({
        date: displayDate,
        fullDate: dateKey,
        time: hour,
        hour: hour,
        activityType: activity.activityType,
        description: activity.description
      })
    })

    return userScatterData
  }

  // Prepare line chart data - activity counts per day
  const prepareLineChartData = () => {
    if (!stats || !stats.dailyStats) {
      return []
    }

    // Get dates from dailyStats
    let dates = Object.keys(stats.dailyStats).sort()

    // If timeRange is not 'all', filter dates to the range
    if (timeRange !== 'all') {
      const endDate = new Date()
      const dateRange = []
      for (let i = timeRange - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(endDate.getDate() - i)
        dateRange.push(date.toISOString().split('T')[0])
      }
      dates = dateRange
    }

    // Create chart data with activity counts
    const chartData = dates.map(date => {
      const d = new Date(date)
      const dataPoint = {
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        fullDate: date,
        total: 0
      }

      // Add each user's activity count for this date
      stats.userStats.forEach(userStat => {
        const count = stats.dailyStats[date]?.[userStat.userId] || 0
        dataPoint[userStat.username] = count
        dataPoint.total += count
      })

      return dataPoint
    })

    return chartData
  }

  const scatterData = prepareScatterData()
  const lineChartData = prepareLineChartData()

  // Color palette for different users
  const colorPalette = [
    '#0891B2',
    '#06B6D4',
    '#0aa2c0',
    '#22c55e',
    '#fb923c',
    '#a855f7',
    '#ec4899',
  ]

  const getActivityIcon = (activityType) => {
    const iconMap = {
      login: '🔐',
      logout: '🚪',
      test_create: '➕',
      test_update: '✏️',
      test_delete: '🗑️',
      patient_create: '👤',
      patient_update: '📝',
      patient_delete: '❌',
      checkup_create: '📋',
      checkup_update: '🔄',
      checkup_delete: '🗑️',
      medicine_create: '💊',
      medicine_update: '📝',
      medicine_delete: '🗑️',
      user_create: '👥',
      user_request_create: '📨',
      user_request_approve: '✅',
      user_request_reject: '❌',
    }
    return iconMap[activityType] || '📌'
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A'
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!isSuperAdmin) {
    return (
      <Alert variant="warning">
        You don't have permission to view user activity. This page is only accessible to SuperAdmins.
      </Alert>
    )
  }

  if (loading) {
    return <LoadingSpinner text="Loading activity data..." />
  }

  return (
    <>
      {/* Time Range Filter */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <FaCalendarAlt className="me-2" style={{ color: '#0891B2' }} />
                  <strong>Time Range:</strong>
                </div>
                <ButtonGroup>
                  <Button
                    variant={timeRange === 'all' ? 'primary' : 'outline-primary'}
                    onClick={() => setTimeRange('all')}
                    style={timeRange === 'all' ? { backgroundColor: '#0891B2', borderColor: '#0891B2' } : { color: '#0891B2', borderColor: '#0891B2' }}
                  >
                    All History
                  </Button>
                  <Button
                    variant={timeRange === 7 ? 'primary' : 'outline-primary'}
                    onClick={() => setTimeRange(7)}
                    style={timeRange === 7 ? { backgroundColor: '#0891B2', borderColor: '#0891B2' } : { color: '#0891B2', borderColor: '#0891B2' }}
                  >
                    Past 7 Days
                  </Button>
                  <Button
                    variant={timeRange === 30 ? 'primary' : 'outline-primary'}
                    onClick={() => setTimeRange(30)}
                    style={timeRange === 30 ? { backgroundColor: '#0891B2', borderColor: '#0891B2' } : { color: '#0891B2', borderColor: '#0891B2' }}
                  >
                    Past 30 Days
                  </Button>
                  <Button
                    variant={timeRange === 90 ? 'primary' : 'outline-primary'}
                    onClick={() => setTimeRange(90)}
                    style={timeRange === 90 ? { backgroundColor: '#0891B2', borderColor: '#0891B2' } : { color: '#0891B2', borderColor: '#0891B2' }}
                  >
                    Past 90 Days
                  </Button>
                </ButtonGroup>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Statistics Cards */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center shadow-sm" style={{ borderTop: '3px solid #0891B2' }}>
            <Card.Body>
              <h3 className="mb-0" style={{ color: '#0891B2' }}>{stats?.totalActivities || 0}</h3>
              <small className="text-muted">Total Activities</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center shadow-sm" style={{ borderTop: '3px solid #06B6D4' }}>
            <Card.Body>
              <h3 className="mb-0" style={{ color: '#06B6D4' }}>{stats?.userStats?.length || 0}</h3>
              <small className="text-muted">Active Users</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center shadow-sm" style={{ borderTop: '3px solid #0aa2c0' }}>
            <Card.Body>
              <h3 className="mb-0" style={{ color: '#0aa2c0' }}>
                {stats?.totalActivities && stats?.userStats?.length
                  ? Math.round(stats.totalActivities / stats.userStats.length)
                  : 0}
              </h3>
              <small className="text-muted">Avg Activities per User</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Scatter Plot - Activity Time Pattern */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Header style={{ backgroundColor: '#f8f9fa' }}>
              <h5 className="mb-0">
                Activity Time Pattern {timeRange === 'all' ? '- All History' : `Over Past ${timeRange} Days`}
              </h5>
              <small className="text-muted">Shows when users were active throughout the day</small>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '400px' }}>
                {Object.keys(scatterData).length > 0 && stats?.userStats?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="category"
                        dataKey="date"
                        name="Date"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        allowDuplicatedCategory={false}
                      />
                      <YAxis
                        type="number"
                        dataKey="time"
                        name="Time"
                        domain={[0, 23]}
                        ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]}
                        tickFormatter={(hour) => `${Math.floor(hour).toString().padStart(2, '0')}:00`}
                        label={{ value: 'Time (24-hour)', angle: -90, position: 'insideLeft' }}
                      />
                      <ZAxis range={[50, 50]} />
                      <Tooltip
                        cursor={{ strokeDasharray: '3 3' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload
                            return (
                              <div style={{ backgroundColor: '#fff', border: '1px solid #ccc', padding: '10px', borderRadius: '5px' }}>
                                <p style={{ margin: 0 }}><strong>Date:</strong> {data.date}</p>
                                <p style={{ margin: 0 }}><strong>Time:</strong> {`${data.hour.toString().padStart(2, '0')}:00`}</p>
                                <p style={{ margin: 0 }}><strong>User:</strong> {payload[0].name}</p>
                                <p style={{ margin: 0 }}><strong>Action:</strong> {data.activityType?.replace(/_/g, ' ')}</p>
                              </div>
                            )
                          }
                          return null
                        }}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      {stats.userStats.map((userStat, index) => (
                        scatterData[userStat.username]?.length > 0 && (
                          <Scatter
                            key={userStat.userId}
                            name={userStat.username}
                            data={scatterData[userStat.username]}
                            fill={colorPalette[index % colorPalette.length]}
                          />
                        )
                      ))}
                    </ScatterChart>
                  </ResponsiveContainer>
                ) : (
                  <Alert variant="info">No activity data available for the selected time range.</Alert>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Line Chart - Activity Count Over Time */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Header style={{ backgroundColor: '#f8f9fa' }}>
              <h5 className="mb-0">
                Activity Count Trend {timeRange === 'all' ? '- All History' : `Over Past ${timeRange} Days`}
              </h5>
              <small className="text-muted">Shows the number of activities per day for each user</small>
            </Card.Header>
            <Card.Body>
              <div style={{ height: '400px' }}>
                {lineChartData.length > 0 && stats?.userStats?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        label={{ value: 'Date', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis
                        label={{ value: 'Number of Activities', angle: -90, position: 'insideLeft' }}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      {stats.userStats.map((userStat, index) => (
                        <Line
                          key={userStat.userId}
                          type="monotone"
                          dataKey={userStat.username}
                          stroke={colorPalette[index % colorPalette.length]}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Alert variant="info">No activity data available for the selected time range.</Alert>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* User Activity Summary */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Header style={{ backgroundColor: '#f8f9fa' }}>
              <h5 className="mb-0">User Activity Summary</h5>
            </Card.Header>
            <Card.Body>
              <Table responsive hover>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Total Activities</th>
                    <th>Most Common Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.userStats?.map(userStat => {
                    const mostCommon = Object.entries(userStat.activities)
                      .sort((a, b) => b[1] - a[1])[0]

                    return (
                      <tr key={userStat.userId}>
                        <td><strong>{userStat.username}</strong></td>
                        <td>
                          <Badge style={{ backgroundColor: '#06B6D4', color: 'white' }}>
                            {userStat.userRole}
                          </Badge>
                        </td>
                        <td>{userStat.totalActivities}</td>
                        <td>
                          {mostCommon ? (
                            <span>
                              {getActivityIcon(mostCommon[0])} {mostCommon[0].replace(/_/g, ' ')} ({mostCommon[1]})
                            </span>
                          ) : 'N/A'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Activity Feed - Prominent */}
      <Row>
        <Col>
          <Card className="shadow-sm" style={{ border: '2px solid #0891B2' }}>
            <Card.Header style={{ backgroundColor: '#0891B2', color: 'white' }}>
              <h5 className="mb-0">
                <FaHistory className="me-2" />
                Recent Activity Logs (Last 20)
              </h5>
            </Card.Header>
            <Card.Body style={{ padding: 0 }}>
              {recentActivities.length === 0 ? (
                <Alert variant="info" className="m-3 text-center">
                  No recent activities found.
                </Alert>
              ) : (
                <div style={{
                  maxHeight: '600px',
                  overflowY: 'auto',
                  backgroundColor: '#f8f9fa'
                }}>
                  {recentActivities.map((activity, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '15px 20px',
                        borderBottom: '1px solid #dee2e6',
                        backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
                        transition: 'background-color 0.2s',
                        cursor: 'default'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e3f2fd'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f8f9fa'}
                    >
                      <div className="d-flex align-items-start">
                        <div style={{
                          fontSize: '1.5rem',
                          marginRight: '15px',
                          minWidth: '30px',
                          textAlign: 'center'
                        }}>
                          {getActivityIcon(activity.activityType)}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="d-flex justify-content-between align-items-start mb-1">
                            <div>
                              <strong style={{ fontSize: '1rem', color: '#0891B2' }}>
                                {activity.username}
                              </strong>
                              <Badge
                                className="ms-2"
                                style={{
                                  backgroundColor: '#06B6D4',
                                  color: 'white',
                                  fontSize: '0.75rem'
                                }}
                              >
                                {activity.userRole}
                              </Badge>
                            </div>
                            <span className="text-muted" style={{ fontSize: '0.875rem' }}>
                              {formatTimestamp(activity.timestamp)}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.95rem', marginTop: '5px' }}>
                            <Badge
                              style={{
                                backgroundColor: '#e3f2fd',
                                color: '#0891B2',
                                fontWeight: 'normal',
                                marginRight: '10px'
                              }}
                            >
                              {activity.activityType.replace(/_/g, ' ')}
                            </Badge>
                            <span>{activity.description}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  )
}

export default UserActivityTab
