import { useState, useEffect } from 'react';

export default function AdminDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('inquiries');
  const [userInquiries, setUserInquiries] = useState({});
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'inquiries') {
      fetchUserInquiries();
    } else {
      fetchInventory();
    }
  }, [activeTab]);

  const fetchUserInquiries = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_GATEWAY_URL}/admin/inquiries`, {
        method: 'GET',
        credentials: 'include'
      });

      const data = await response.json();
      if (response.ok && data.status === 'ok') {
        setUserInquiries(data.inquiries || {});
      }
    } catch (err) {
      console.error('Failed to fetch user inquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_GATEWAY_URL}/admin/inventory`, {
        method: 'GET',
        credentials: 'include'
      });

      const data = await response.json();
      if (response.ok && data.status === 'ok') {
        setInventory(data.inventory || []);
      }
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.mainTitle}>Admin Dashboard</h2>

      {/* Tab Buttons */}
      <div style={styles.tabButtons}>
        <button
          onClick={() => setActiveTab('inquiries')}
          style={activeTab === 'inquiries' ? styles.tabActive : styles.tab}
        >
          User Inquiries
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          style={activeTab === 'inventory' ? styles.tabActive : styles.tab}
        >
          Inventory Items
        </button>
      </div>

      {loading ? (
        <div style={styles.loading}>Loading...</div>
      ) : (
        <>
          {/* User Inquiries Tab */}
          {activeTab === 'inquiries' && (
            <div style={styles.content}>
              {Object.keys(userInquiries).length === 0 ? (
                <div style={styles.emptyText}>No user inquiries found.</div>
              ) : (
                Object.entries(userInquiries).map(([username, inquiries]) => (
                  <div key={username} style={styles.userSection}>
                    <h3 style={styles.username}>
                      {username} ({inquiries.length} {inquiries.length === 1 ? 'inquiry' : 'inquiries'})
                    </h3>
                    <div style={styles.inquiryList}>
                      {inquiries.map((inq) => (
                        <div key={inq.id} style={styles.card}>
                          <div style={styles.cardHeader}>
                            <span style={styles.cardId}>ID: {inq.id.slice(0, 8)}...</span>
                            <span style={styles.status}>{inq.status}</span>
                          </div>
                          <div style={styles.cardBody}>
                            {inq.image_url && (
                              <img
                                src={`${import.meta.env.VITE_GATEWAY_URL}${inq.image_url}`}
                                alt="Lost item"
                                style={styles.image}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            )}
                            <p style={styles.description}>{inq.description}</p>
                            <div style={styles.details}>
                              <span><strong>Date Lost:</strong> {inq.date_lost}</span>
                              <span><strong>Place:</strong> {inq.place_lost}</span>
                              <span><strong>Color:</strong> {inq.color}</span>
                              <span><strong>Cost:</strong> ${inq.approx_cost}</span>
                              <span><strong>Size:</strong> {inq.size_category}</span>
                            </div>
                            <div style={styles.timestamp}>
                              Submitted: {new Date(inq.timestamp).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Inventory Tab */}
          {activeTab === 'inventory' && (
            <div style={styles.content}>
              {inventory.length === 0 ? (
                <div style={styles.emptyText}>No inventory items found.</div>
              ) : (
                <div style={styles.inquiryList}>
                  {inventory.map((item) => (
                    <div key={item.id} style={styles.card}>
                      <div style={styles.cardHeader}>
                        <span style={styles.cardId}>ID: {item.id.slice(0, 8)}...</span>
                        <span style={styles.status}>{item.status}</span>
                      </div>
                      <div style={styles.cardBody}>
                        {item.image_url && (
                          <img
                            src={`${import.meta.env.VITE_GATEWAY_URL}${item.image_url}`}
                            alt="Inventory item"
                            style={styles.image}
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                          />
                        )}
                        <p style={styles.description}>{item.description}</p>
                        <div style={styles.details}>
                          <span><strong>Date Lost:</strong> {item.date_lost}</span>
                          <span><strong>Place:</strong> {item.place_lost}</span>
                          <span><strong>Color:</strong> {item.color}</span>
                          <span><strong>Cost:</strong> ${item.approx_cost}</span>
                          <span><strong>Size:</strong> {item.size_category}</span>
                        </div>
                        <div style={styles.timestamp}>
                          Added: {new Date(item.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    marginTop: '32px',
    padding: '32px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  mainTitle: {
    margin: '0 0 24px 0',
    fontSize: '24px',
    fontWeight: '300',
    color: '#0a6ed1'
  },
  tabButtons: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '1px solid #e8e8e8',
    paddingBottom: '8px'
  },
  tab: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#666',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '4px 4px 0 0',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  tabActive: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#0a6ed1',
    backgroundColor: '#e6f7ff',
    border: 'none',
    borderRadius: '4px 4px 0 0',
    cursor: 'pointer'
  },
  loading: {
    padding: '48px',
    textAlign: 'center',
    color: '#666',
    fontSize: '14px'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  },
  emptyText: {
    padding: '48px',
    textAlign: 'center',
    color: '#999',
    fontSize: '14px',
    fontStyle: 'italic'
  },
  userSection: {
    marginBottom: '24px'
  },
  username: {
    margin: '0 0 16px 0',
    fontSize: '18px',
    fontWeight: '500',
    color: '#333',
    padding: '12px 16px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px'
  },
  inquiryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  card: {
    border: '1px solid #e8e8e8',
    borderRadius: '6px',
    padding: '16px',
    backgroundColor: '#fafafa'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e8e8e8'
  },
  cardId: {
    fontSize: '12px',
    color: '#666',
    fontFamily: 'monospace'
  },
  status: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#0a6ed1',
    backgroundColor: '#e6f7ff',
    padding: '4px 12px',
    borderRadius: '12px',
    textTransform: 'capitalize'
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  image: {
    width: '100%',
    maxWidth: '300px',
    height: 'auto',
    borderRadius: '4px',
    objectFit: 'cover'
  },
  description: {
    margin: 0,
    fontSize: '14px',
    color: '#333',
    lineHeight: '1.5'
  },
  details: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    fontSize: '13px',
    color: '#666'
  },
  timestamp: {
    fontSize: '11px',
    color: '#999'
  }
};
