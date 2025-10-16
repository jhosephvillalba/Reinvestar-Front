import React, { useState, useEffect } from 'react';
import { getVendorPipeline, getCoordinatorDashboard, getRequestTimeline } from '../../../Api/pipeline';
import { useNavigate } from 'react-router-dom';
import styles from './style.module.css';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    summary: {
      total_requests: 0,
      dscr_requests: 0,
      construction_requests: 0,
      fixflip_requests: 0,
      pending_approval: 0,
      in_process: 0,
      approved: 0,
      rejected: 0,
      document_progress: 0
    },
    recent_activity: [],
    vendors_performance: [],
    processors_workload: [],
    vendor_pipeline: {
      dscr: [],
      fixflip: [],
      construction: []
    }
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [dashboardData, pipelineData] = await Promise.all([
        getCoordinatorDashboard(),
        getVendorPipeline()
      ]);
      
      setDashboardData({
        summary: dashboardData?.summary || {
          total_requests: 0,
          dscr_requests: 0,
          construction_requests: 0,
          fixflip_requests: 0,
          pending_approval: 0,
          in_process: 0,
          approved: 0,
          rejected: 0,
          document_progress: 0
        },
        recent_activity: Array.isArray(dashboardData?.recent_activity) ? dashboardData.recent_activity : [],
        vendors_performance: Array.isArray(dashboardData?.vendors_performance) ? dashboardData.vendors_performance : [],
        processors_workload: Array.isArray(dashboardData?.processors_workload) ? dashboardData.processors_workload : [],
        vendor_pipeline: {
          dscr: Array.isArray(pipelineData?.dscr) ? pipelineData.dscr : [],
          fixflip: Array.isArray(pipelineData?.fixflip) ? pipelineData.fixflip : [],
          construction: Array.isArray(pipelineData?.construction) ? pipelineData.construction : []
        }
      });
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Error loading dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadTimeline = async (type, id) => {
    try {
      const timelineData = await getRequestTimeline(type, id);
      setTimeline(Array.isArray(timelineData) ? timelineData : []);
      setSelectedRequest({ type, id });
    } catch (err) {
      console.error('Error loading timeline:', err);
      setTimeline([]);
    }
  };

  // Calculate totals for pipeline data
  const getPipelineTotal = (pipelineData) => {
    return pipelineData.reduce((sum, stage) => sum + (stage.count || 0), 0);
  };

  const getPipelineAmount = (pipelineData) => {
    return pipelineData.reduce((sum, stage) => sum + (stage.total_amount || 0), 0);
  };

  // Generate chart data for request types
  const getRequestTypeData = () => {
    const { summary } = dashboardData;
    return [
      { name: 'DSCR', value: summary.dscr_requests, color: '#FFC862' },
      { name: 'Fixflip', value: summary.fixflip_requests, color: '#1B2559' },
      { name: 'Construction', value: summary.construction_requests, color: '#2c3e50' }
    ].filter(item => item.value > 0);
  };

  // Generate chart data for request status
  const getRequestStatusData = () => {
    const { summary } = dashboardData;
    return [
      { name: 'Pending', value: summary.pending_approval, color: '#FFC862' },
      { name: 'In Process', value: summary.in_process, color: '#1B2559' },
      { name: 'Approved', value: summary.approved, color: '#10b981' },
      { name: 'Rejected', value: summary.rejected, color: '#ef4444' }
    ].filter(item => item.value > 0);
  };

  // Generate line chart data for request trends (using real backend data)
  const getRequestTrendData = () => {
    const { summary } = dashboardData;
    
    // If backend provides trend data, use it; otherwise show current totals
    if (dashboardData.request_trends && Array.isArray(dashboardData.request_trends)) {
      return dashboardData.request_trends;
    }
    
    // Fallback: show current values as a single data point
    return [
      {
        month: 'Current',
        dscr: summary.dscr_requests || 0,
        fixflip: summary.fixflip_requests || 0,
        construction: summary.construction_requests || 0
      }
    ];
  };


  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading Dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger" role="alert">
          <h4 className="alert-heading">Error</h4>
          <p>{error}</p>
          <hr />
          <button className="btn btn-outline-danger" onClick={loadDashboardData}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { summary, recent_activity, vendors_performance, processors_workload, vendor_pipeline } = dashboardData;
  const requestTypeData = getRequestTypeData();
  const requestStatusData = getRequestStatusData();
  const requestTrendData = getRequestTrendData();

  return (
    <div className={styles.dashboardContainer}>
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-0 my_title_color fw-bolder">Executive Dashboard</h1>
              <p className="text-muted mb-0">Comprehensive overview of requests and performance</p>
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/requests/new-request')}
              >
                <i className="fas fa-plus me-2"></i>
                New Request
              </button>
              <button 
                className="btn btn-outline-secondary"
                onClick={() => navigate('/requests')}
              >
                <i className="fas fa-list me-2"></i>
                View Requests
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* First row - Main metrics */}
      <div className="row mb-4">
        {/* Total Requests - Main metric */}
        <div className="col-lg-3 mb-4">
          <div className={styles.mainMetricCard}>
            <div className={styles.metricIcon}>
              <i className="fas fa-chart-line"></i>
                  </div>
            <div className={styles.metricContent}>
              <h3 className={styles.metricValue}>{summary.total_requests.toLocaleString()}</h3>
              <p className={styles.metricTitle}>Total Requests</p>
              <small className={styles.metricSubtitle}>All requests</small>
            </div>
          </div>
        </div>

        {/* Requests In Process */}
        <div className="col-lg-3 mb-4">
          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{backgroundColor: '#FFC862'}}>
              <i className="fas fa-clock text-white"></i>
                  </div>
            <div className={styles.metricContent}>
              <h4 className={styles.metricValue}>{summary.in_process.toLocaleString()}</h4>
              <p className={styles.metricTitle}>In Process</p>
              <small className={styles.metricSubtitle}>Active requests</small>
                </div>
                </div>
              </div>

        {/* Approved Requests */}
        <div className="col-lg-3 mb-4">
          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{backgroundColor: '#10b981'}}>
              <i className="fas fa-check text-white"></i>
            </div>
            <div className={styles.metricContent}>
              <h4 className={styles.metricValue}>{summary.approved.toLocaleString()}</h4>
              <p className={styles.metricTitle}>Approved</p>
              <small className={styles.metricSubtitle}>Approved requests</small>
            </div>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="col-lg-3 mb-4">
          <div className={styles.metricCard}>
            <div className={styles.metricIcon} style={{backgroundColor: '#f59e0b'}}>
              <i className="fas fa-hourglass-half text-white"></i>
                  </div>
            <div className={styles.metricContent}>
              <h4 className={styles.metricValue}>{summary.pending_approval.toLocaleString()}</h4>
              <p className={styles.metricTitle}>Pending</p>
              <small className={styles.metricSubtitle}>Awaiting approval</small>
            </div>
          </div>
        </div>
      </div>

      {/* Second row - Request trends chart */}
      <div className="row mb-4">
        <div className="col-12 mb-4">
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h5 className={styles.chartTitle}>
                <i className="fas fa-chart-line me-2" style={{color: '#FFC862'}}></i>
                Request Trends by Type
              </h5>
              <p className={styles.chartSubtitle}>Comparative view of DSCR, Fixflip and Construction requests</p>
            </div>
            <div className={styles.combinedLineChart}>
              {requestTrendData.length > 0 ? (
                <>
                  <svg width="100%" height="300" viewBox="0 0 800 300">
                    <defs>
                      <linearGradient id="dscrGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#FFC862" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#FFC862" stopOpacity="0.05"/>
                      </linearGradient>
                      <linearGradient id="fixflipGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#1B2559" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#1B2559" stopOpacity="0.05"/>
                      </linearGradient>
                      <linearGradient id="constructionGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#2c3e50" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#2c3e50" stopOpacity="0.05"/>
                      </linearGradient>
                    </defs>
                    
                    {/* Grid lines */}
                    <g className="grid-lines">
                      {requestTrendData.map((_, i) => (
                        <line
                          key={`grid-${i}`}
                          x1={50 + (i * (720 / Math.max(requestTrendData.length - 1, 1)))}
                          y1="50"
                          x2={50 + (i * (720 / Math.max(requestTrendData.length - 1, 1)))}
                          y2="250"
                          stroke="#e5e7eb"
                          strokeWidth="1"
                          strokeDasharray="2,2"
                        />
                      ))}
                      {[0, 1, 2, 3, 4].map((i) => (
                        <line
                          key={`hgrid-${i}`}
                          x1="50"
                          y1={50 + (i * 50)}
                          x2="770"
                          y2={50 + (i * 50)}
                          stroke="#e5e7eb"
                          strokeWidth="1"
                          strokeDasharray="2,2"
                        />
                      ))}
                    </g>

                    {/* Month labels */}
                    {requestTrendData.map((point, index) => (
                      <text
                        key={`month-${index}`}
                        x={50 + (index * (720 / Math.max(requestTrendData.length - 1, 1)))}
                        y="280"
                        textAnchor="middle"
                        fontSize="12"
                        fill="#6c757d"
                        fontWeight="500"
                      >
                        {point.month}
                      </text>
                    ))}

                    {/* Y-axis labels */}
                    {[0, 1, 2, 3, 4].map((i) => {
                      const maxValue = Math.max(
                        ...requestTrendData.map(p => Math.max(p.dscr || 0, p.fixflip || 0, p.construction || 0)),
                        1
                      );
                      const value = Math.round((maxValue / 4) * (4 - i));
                      return (
                        <text
                          key={`y-${i}`}
                          x="35"
                          y={55 + (i * 50)}
                          textAnchor="end"
                          fontSize="11"
                          fill="#6c757d"
                        >
                          {value}
                        </text>
                      );
                    })}

                    {/* DSCR Line and Area */}
                    <path
                      d={requestTrendData.map((point, index) => {
                        const x = 50 + (index * (720 / Math.max(requestTrendData.length - 1, 1)));
                        const maxValue = Math.max(
                          ...requestTrendData.map(p => Math.max(p.dscr || 0, p.fixflip || 0, p.construction || 0)),
                          1
                        );
                        const y = 250 - ((point.dscr || 0) / maxValue) * 200;
                        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#FFC862"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {requestTrendData.map((point, index) => {
                      const x = 50 + (index * (720 / Math.max(requestTrendData.length - 1, 1)));
                      const maxValue = Math.max(
                        ...requestTrendData.map(p => Math.max(p.dscr || 0, p.fixflip || 0, p.construction || 0)),
                        1
                      );
                      const y = 250 - ((point.dscr || 0) / maxValue) * 200;
                      return (
                        <circle
                          key={`dscr-${index}`}
                          cx={x}
                          cy={y}
                          r="5"
                          fill="#FFC862"
                          stroke="#fff"
                          strokeWidth="2"
                        />
                      );
                    })}

                    {/* Fixflip Line and Area */}
                    <path
                      d={requestTrendData.map((point, index) => {
                        const x = 50 + (index * (720 / Math.max(requestTrendData.length - 1, 1)));
                        const maxValue = Math.max(
                          ...requestTrendData.map(p => Math.max(p.dscr || 0, p.fixflip || 0, p.construction || 0)),
                          1
                        );
                        const y = 250 - ((point.fixflip || 0) / maxValue) * 200;
                        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#1B2559"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {requestTrendData.map((point, index) => {
                      const x = 50 + (index * (720 / Math.max(requestTrendData.length - 1, 1)));
                      const maxValue = Math.max(
                        ...requestTrendData.map(p => Math.max(p.dscr || 0, p.fixflip || 0, p.construction || 0)),
                        1
                      );
                      const y = 250 - ((point.fixflip || 0) / maxValue) * 200;
                      return (
                        <circle
                          key={`fixflip-${index}`}
                          cx={x}
                          cy={y}
                          r="5"
                          fill="#1B2559"
                          stroke="#fff"
                          strokeWidth="2"
                        />
                      );
                    })}

                    {/* Construction Line and Area */}
                    <path
                      d={requestTrendData.map((point, index) => {
                        const x = 50 + (index * (720 / Math.max(requestTrendData.length - 1, 1)));
                        const maxValue = Math.max(
                          ...requestTrendData.map(p => Math.max(p.dscr || 0, p.fixflip || 0, p.construction || 0)),
                          1
                        );
                        const y = 250 - ((point.construction || 0) / maxValue) * 200;
                        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                      }).join(' ')}
                      fill="none"
                      stroke="#2c3e50"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {requestTrendData.map((point, index) => {
                      const x = 50 + (index * (720 / Math.max(requestTrendData.length - 1, 1)));
                      const maxValue = Math.max(
                        ...requestTrendData.map(p => Math.max(p.dscr || 0, p.fixflip || 0, p.construction || 0)),
                        1
                      );
                      const y = 250 - ((point.construction || 0) / maxValue) * 200;
                      return (
                        <circle
                          key={`construction-${index}`}
                          cx={x}
                          cy={y}
                          r="5"
                          fill="#2c3e50"
                          stroke="#fff"
                          strokeWidth="2"
                        />
                      );
                    })}
                  </svg>
                  
                  {/* Legend */}
                  <div className={styles.combinedChartLegend}>
                    <div className={styles.legendItem}>
                      <span className={styles.legendColor} style={{backgroundColor: '#FFC862'}}></span>
                      <span>DSCR: {summary.dscr_requests}</span>
                    </div>
                    <div className={styles.legendItem}>
                      <span className={styles.legendColor} style={{backgroundColor: '#1B2559'}}></span>
                      <span>Fixflip: {summary.fixflip_requests}</span>
                    </div>
                    <div className={styles.legendItem}>
                      <span className={styles.legendColor} style={{backgroundColor: '#2c3e50'}}></span>
                      <span>Construction: {summary.construction_requests}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="fas fa-chart-line fs-1 mb-3 d-block"></i>
                  No trend data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Third row - Distribution and status */}
      <div className="row mb-4">
        {/* Distribution by Type - Donut chart */}
        <div className="col-lg-6 mb-4">
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h5 className={styles.chartTitle}>
                <i className="fas fa-chart-pie me-2" style={{color: '#FFC862'}}></i>
                Distribution by Type
              </h5>
              <p className={styles.chartSubtitle}>Requests by category</p>
            </div>
            <div className={styles.pieChart}>
              {requestTypeData.length > 0 ? (
                <>
                  <svg width="200" height="200" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="80" fill="none" stroke="#e5e7eb" strokeWidth="40"/>
                      {requestTypeData.map((item, index) => {
                        const total = requestTypeData.reduce((sum, d) => sum + d.value, 0);
                        const percentage = (item.value / total) * 100;
                      const circumference = 2 * Math.PI * 80;
                        const strokeDasharray = (percentage / 100) * circumference;
                        const strokeDashoffset = circumference - strokeDasharray;
                        const rotation = requestTypeData
                          .slice(0, index)
                          .reduce((sum, d) => sum + (d.value / total) * 360, 0);
                        
                        return (
                          <circle
                            key={item.name}
                          cx="100"
                          cy="100"
                          r="80"
                            fill="none"
                            stroke={item.color}
                          strokeWidth="40"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                          transform={`rotate(${rotation} 100 100)`}
                          />
                        );
                      })}
                    </svg>
                  <div className={styles.pieLegend}>
                    {requestTypeData.map((item) => (
                      <div key={item.name} className={styles.legendItem}>
                        <span className={styles.legendColor} style={{backgroundColor: item.color}}></span>
                        <span>{item.name}: {item.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="fas fa-chart-pie fs-1 mb-3 d-block"></i>
                  No data available
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Request Status - Bar chart */}
        <div className="col-lg-6 mb-4">
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h5 className={styles.chartTitle}>
                <i className="fas fa-chart-bar me-2" style={{color: '#1B2559'}}></i>
                Request Status
              </h5>
              <p className={styles.chartSubtitle}>Distribution by status</p>
            </div>
            <div className={styles.barChart}>
              {requestStatusData.length > 0 ? (
                requestStatusData.map((item) => {
                    const maxValue = Math.max(...requestStatusData.map(d => d.value));
                    const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                    
                    return (
                    <div key={item.name} className={styles.barGroup}>
                      <div className={styles.barLabel}>{item.name}</div>
                      <div className={styles.barContainer}>
                        <div 
                          className={styles.bar} 
                              style={{ 
                                width: `${percentage}%`, 
                                backgroundColor: item.color 
                              }}
                        >
                          {item.value}
                          </div>
                        </div>
                      </div>
                    );
                })
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="fas fa-chart-bar fs-1 mb-3 d-block"></i>
                  No data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fourth row - Additional KPIs */}
      <div className="row mb-4">
        {/* Document Progress */}
        <div className="col-lg-3 mb-4">
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon} style={{backgroundColor: '#10b981'}}>
              <i className="fas fa-file-alt text-white"></i>
            </div>
            <div className={styles.kpiContent}>
              <h4 className={styles.kpiValue}>{summary.document_progress}%</h4>
              <p className={styles.kpiTitle}>Document Progress</p>
              <small className={styles.kpiSubtitle}>Overall completion</small>
              </div>
                </div>
                </div>

        {/* Rejected Requests */}
        <div className="col-lg-3 mb-4">
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon} style={{backgroundColor: '#ef4444'}}>
              <i className="fas fa-times text-white"></i>
                </div>
            <div className={styles.kpiContent}>
              <h4 className={styles.kpiValue}>{summary.rejected.toLocaleString()}</h4>
              <p className={styles.kpiTitle}>Rejected</p>
              <small className={styles.kpiSubtitle}>Rejected requests</small>
              </div>
            </div>
          </div>

        {/* Vendor Performance */}
        <div className="col-lg-3 mb-4">
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon} style={{backgroundColor: '#FFC862'}}>
              <i className="fas fa-users text-white"></i>
        </div>
            <div className={styles.kpiContent}>
              <h4 className={styles.kpiValue}>{vendors_performance.length}</h4>
              <p className={styles.kpiTitle}>Active Vendors</p>
              <small className={styles.kpiSubtitle}>Total vendors</small>
      </div>
            </div>
                            </div>

        {/* Active Processors */}
        <div className="col-lg-3 mb-4">
          <div className={styles.kpiCard}>
            <div className={styles.kpiIcon} style={{backgroundColor: '#1B2559'}}>
              <i className="fas fa-cogs text-white"></i>
                          </div>
            <div className={styles.kpiContent}>
              <h4 className={styles.kpiValue}>{processors_workload.length}</h4>
              <p className={styles.kpiTitle}>Processors</p>
              <small className={styles.kpiSubtitle}>Total processors</small>
              </div>
            </div>
          </div>
        </div>

      {/* Fifth row - Performance charts */}
      <div className="row mb-4">
        {/* Vendor Performance */}
        <div className="col-lg-6 mb-4">
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h5 className={styles.chartTitle}>
                <i className="fas fa-chart-bar me-2" style={{color: '#FFC862'}}></i>
                Vendor Performance
              </h5>
              <p className={styles.chartSubtitle}>Approval rate by vendor</p>
            </div>
            <div className={styles.performanceChart}>
              {vendors_performance.slice(0, 8).map((vendor, index) => (
                <div key={vendor.id} className={styles.performanceBar}>
                  <div className={styles.barLabel}>{vendor.name?.substring(0, 15) || 'Vendor ' + (index + 1)}</div>
                  <div className={styles.barContainer}>
                    <div 
                      className={styles.bar} 
                      style={{
                        height: `${Math.min((vendor.approval_rate || 0) * 2, 100)}px`,
                        backgroundColor: index % 2 === 0 ? '#FFC862' : '#1B2559'
                      }}
                    >
                      {vendor.approval_rate || 0}%
                            </div>
                          </div>
                </div>
              ))}
          </div>
        </div>
      </div>

        {/* Processor Workload */}
        <div className="col-lg-6 mb-4">
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h5 className={styles.chartTitle}>
                <i className="fas fa-chart-bar me-2" style={{color: '#1B2559'}}></i>
                Processor Workload
              </h5>
              <p className={styles.chartSubtitle}>Active assignments per processor</p>
            </div>
            <div className={styles.performanceChart}>
              {processors_workload.slice(0, 8).map((processor, index) => (
                <div key={processor.id} className={styles.performanceBar}>
                  <div className={styles.barLabel}>{processor.name?.substring(0, 15) || 'Processor ' + (index + 1)}</div>
                  <div className={styles.barContainer}>
                    <div 
                      className={styles.bar} 
                      style={{
                        height: `${Math.min((processor.active_assignments || 0) * 10, 100)}px`,
                        backgroundColor: index % 2 === 0 ? '#1B2559' : '#FFC862'
                      }}
                    >
                      {processor.active_assignments || 0}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Pipeline - Keep existing functionality */}
      <div className="row mb-4">
        <div className="col-12">
          <div className={styles.tableCard}>
            <div className={styles.tableHeader}>
              <h5 className="card-title mb-0 fw-bold my_title_color">
                <i className="fas fa-project-diagram me-2"></i>
                Vendor Pipeline
              </h5>
            </div>
            <div className={styles.tableBody}>
              <div className="row">
                {/* DSCR Pipeline */}
                <div className="col-lg-4 mb-4">
                  <div className={styles.pipelineCard}>
                    <div className={styles.pipelineHeader}>
                      <h6 className="mb-0 fw-bold my_title_color">
                        <i className="fas fa-chart-line me-2" style={{color: '#FFC862'}}></i>
                        DSCR
                        <span className="badge bg-primary ms-2">
                          {getPipelineTotal(vendor_pipeline.dscr)}
                        </span>
                      </h6>
                    </div>
                    <div className={styles.pipelineBody}>
                      {vendor_pipeline.dscr.length > 0 ? (
                        vendor_pipeline.dscr.map((stage, index) => (
                          <div key={index} className={styles.pipelineStage}>
                            <div>
                              <small className="text-muted d-block">{stage.stage || 'No stage'}</small>
                              <strong className="text-success">${(stage.total_amount || 0).toLocaleString()}</strong>
                            </div>
                            <span className="badge bg-primary">{stage.count || 0}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-muted py-3">
                          <i className="fas fa-chart-line fs-3 mb-2 d-block"></i>
                          No DSCR pipeline data
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Fixflip Pipeline */}
                <div className="col-lg-4 mb-4">
                  <div className={styles.pipelineCard}>
                    <div className={styles.pipelineHeader}>
                      <h6 className="mb-0 fw-bold my_title_color">
                        <i className="fas fa-chart-line me-2" style={{color: '#1B2559'}}></i>
                        Fixflip
                        <span className="badge bg-success ms-2">
                          {getPipelineTotal(vendor_pipeline.fixflip)}
                        </span>
                      </h6>
                    </div>
                    <div className={styles.pipelineBody}>
                      {vendor_pipeline.fixflip.length > 0 ? (
                        vendor_pipeline.fixflip.map((stage, index) => (
                          <div key={index} className={styles.pipelineStage}>
                            <div>
                              <small className="text-muted d-block">{stage.stage || 'No stage'}</small>
                              <strong className="text-success">${(stage.total_amount || 0).toLocaleString()}</strong>
                            </div>
                            <span className="badge bg-success">{stage.count || 0}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-muted py-3">
                          <i className="fas fa-chart-line fs-3 mb-2 d-block"></i>
                          No Fixflip pipeline data
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Construction Pipeline */}
                <div className="col-lg-4 mb-4">
                  <div className={styles.pipelineCard}>
                    <div className={styles.pipelineHeader}>
                      <h6 className="mb-0 fw-bold my_title_color">
                        <i className="fas fa-chart-line me-2" style={{color: '#2c3e50'}}></i>
                        Construction
                        <span className="badge bg-warning ms-2">
                          {getPipelineTotal(vendor_pipeline.construction)}
                        </span>
                      </h6>
                    </div>
                    <div className={styles.pipelineBody}>
                      {vendor_pipeline.construction.length > 0 ? (
                        vendor_pipeline.construction.map((stage, index) => (
                          <div key={index} className={styles.pipelineStage}>
                            <div>
                              <small className="text-muted d-block">{stage.stage || 'No stage'}</small>
                              <strong className="text-success">${(stage.total_amount || 0).toLocaleString()}</strong>
                            </div>
                            <span className="badge bg-warning">{stage.count || 0}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-muted py-3">
                          <i className="fas fa-chart-line fs-3 mb-2 d-block"></i>
                          No Construction pipeline data
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Selected request timeline - Keep existing functionality */}
      {selectedRequest && timeline.length > 0 && (
        <div className="row mb-4">
          <div className="col-12">
            <div className={styles.tableCard}>
              <div className={styles.tableHeader}>
                <h5 className="card-title mb-0 fw-bold my_title_color">
                  <i className="fas fa-clock me-2"></i>
                  Request Timeline
                </h5>
                <button 
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => setSelectedRequest(null)}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <div className={styles.tableBody}>
                <div className="timeline">
                  {timeline.map((event, index) => (
                    <div key={index} className="d-flex mb-3">
                      <div className="flex-shrink-0">
                        <div className="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: '32px', height: '32px' }}>
                          <i className="fas fa-calendar text-white small"></i>
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="mb-1 fw-bold my_title_color">{event.title || 'No title'}</h6>
                            <p className="mb-1 text-muted">{event.description || 'No description'}</p>
                            {event.status && (
                              <span className={`badge ${event.status === 'approved' ? 'bg-success' : event.status === 'rejected' ? 'bg-danger' : event.status === 'pending' ? 'bg-warning' : 'bg-info'}`}>
                                {event.status}
                              </span>
                            )}
                          </div>
                          <small className="text-muted">
                            {event.timestamp ? new Date(event.timestamp).toLocaleDateString() : 'Date not available'}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 