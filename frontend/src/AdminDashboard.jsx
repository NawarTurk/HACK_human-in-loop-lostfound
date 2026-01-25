import { useState, useEffect } from 'react';

export default function AdminDashboard({ user }) {
  const [activeTab, setActiveTab] = useState('inquiries');
  const [userInquiries, setUserInquiries] = useState({});
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Add inventory form state
  const [description, setDescription] = useState('');
  const [placeFound, setPlaceFound] = useState('');
  const [dateFound, setDateFound] = useState(new Date().toISOString().split('T')[0]);
  const [color, setColor] = useState('');
  const [cost, setCost] = useState('');
  const [sizeCategory, setSizeCategory] = useState('');
  const [status, setStatus] = useState('submitted');
  const [image, setImage] = useState(null);
  const [formMessage, setFormMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Edit state
  const [editingItemId, setEditingItemId] = useState(null);
  const [editStatus, setEditStatus] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editCost, setEditCost] = useState('');
  const [editSize, setEditSize] = useState('');
  const [editPlace, setEditPlace] = useState('');

  // Matching state
  const [processingInquiry, setProcessingInquiry] = useState(null);
  const [matches, setMatches] = useState({});
  const [loadingMatches, setLoadingMatches] = useState(false);

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

  const handleAddInventory = async (e) => {
    e.preventDefault();
    setFormMessage('');
    setFormError('');
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('username', user.username);
      formData.append('description', description);
      formData.append('date_lost', dateFound);
      formData.append('place_lost', placeFound);
      formData.append('color', color);
      formData.append('cost', cost);
      formData.append('size_category', sizeCategory);
      formData.append('status', status);
      if (image) {
        formData.append('image', image);
      }

      const response = await fetch(`${import.meta.env.VITE_GATEWAY_URL}/inquiry/submit`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.status === 'ok') {
        setFormMessage('Item added to inventory successfully!');
        // Clear form
        setDescription('');
        setPlaceFound('');
        setDateFound(new Date().toISOString().split('T')[0]);
        setColor('');
        setCost('');
        setSizeCategory('');
        setStatus('submitted');
        setImage(null);
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
        
        // Refresh inventory list
        fetchInventory();
      } else {
        setFormError(data.message || 'Failed to add item');
      }
    } catch (err) {
      setFormError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateItem = async (itemId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_GATEWAY_URL}/admin/inventory/${itemId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: editStatus,
          description: editDescription,
          color: editColor,
          approx_cost: editCost,
          size_category: editSize,
          place_lost: editPlace
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'ok') {
        // Refresh inventory
        fetchInventory();
        setEditingItemId(null);
      } else {
        console.error('Failed to update item:', data.message);
      }
    } catch (err) {
      console.error('Failed to update item:', err);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_GATEWAY_URL}/admin/inventory/${itemId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.status === 'ok') {
        fetchInventory();
      } else {
        alert('Failed to delete item: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Failed to delete item: Network error');
    }
  };

  const handleUpdateInquiryStatus = async (username, inquiryId, newStatus) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_GATEWAY_URL}/admin/inquiries/${username}/${inquiryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      const data = await response.json();

      if (response.ok && data.status === 'ok') {
        // Refresh inquiries
        fetchUserInquiries();
      } else {
        console.error('Failed to update status:', data.message);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleProcessInquiry = async (username, inquiryId) => {
    setLoadingMatches(true);
    setProcessingInquiry(inquiryId);
    
    // First update inquiry status to under_review
    await handleUpdateInquiryStatus(username, inquiryId, 'under_review');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_GATEWAY_URL}/admin/inquiries/${username}/${inquiryId}/match`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok && data.status === 'ok') {
        // Store matches for this inquiry
        setMatches(prev => ({
          ...prev,
          [inquiryId]: data.matches
        }));
      } else {
        alert('Failed to process inquiry: ' + (data.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Failed to process inquiry: Network error');
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleMarkAsMatch = async (username, inquiryId, inventoryId) => {
    // Update inquiry status to matched and store the matched inventory ID
    try {
      const response = await fetch(`${import.meta.env.VITE_GATEWAY_URL}/admin/inquiries/${username}/${inquiryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ 
          status: 'matched',
          matched_inventory_id: inventoryId  // Store which inventory item was matched
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'ok') {
        // Refresh inquiries
        fetchUserInquiries();
      } else {
        console.error('Failed to update status:', data.message);
      }
    } catch (err) {
      alert('Failed to update status: Network error');
    }
    
    // Also update the inventory item status to matched
    if (inventoryId) {
      try {
        const response = await fetch(`${import.meta.env.VITE_GATEWAY_URL}/admin/inventory/${inventoryId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'matched' })
        });
        
        if (response.ok) {
          console.log('Inventory item status updated to matched');
        }
      } catch (err) {
        console.error('Failed to update inventory status:', err);
      }
    }
    
    // Clear matches after marking
    setMatches(prev => {
      const updated = { ...prev };
      delete updated[inquiryId];
      return updated;
    });
    setProcessingInquiry(null);
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
                        <div key={inq.id} style={styles.inquiryWrapper}>
                          <div style={styles.card}>
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
                                <span><strong>Email:</strong> {inq.email}</span>
                                <span><strong>Date Lost:</strong> {inq.date_lost}</span>
                                <span><strong>Place:</strong> {inq.place_lost}</span>
                                <span><strong>Color:</strong> {inq.color}</span>
                                <span><strong>Cost:</strong> ${inq.approx_cost}</span>
                                <span><strong>Size:</strong> {inq.size_category}</span>
                              </div>
                              
                              {/* Process Button */}
                              <button
                                onClick={() => handleProcessInquiry(username, inq.id)}
                                disabled={loadingMatches && processingInquiry === inq.id}
                                style={styles.processButton}
                              >
                                {loadingMatches && processingInquiry === inq.id ? 'Processing...' : 'Process Matches'}
                              </button>
                              
                              <div style={styles.statusUpdate}>
                                <label style={styles.statusLabel}>Update Status:</label>
                                <select
                                  value={inq.status}
                                  onChange={(e) => handleUpdateInquiryStatus(username, inq.id, e.target.value)}
                                  style={styles.statusSelect}
                                >
                                  <option value="submitted">Submitted</option>
                                  <option value="under_review">Under Review</option>
                                  <option value="matched">Matched</option>
                                  <option value="resolved">Resolved</option>
                                </select>
                                {inq.email_sent && <span style={styles.emailSentBadge}>✓ Email Sent</span>}
                              </div>
                              <div style={styles.timestamp}>
                                Submitted: {new Date(inq.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          
                          {/* Matches Section - Expands Below Card */}
                          {matches[inq.id] && matches[inq.id].length > 0 && (
                            <div style={styles.matchesSection}>
                              <h4 style={styles.matchesTitle}>
                                Top {matches[inq.id].length} Matching Inventory Items
                              </h4>
                              <div style={styles.matchesList}>
                                {matches[inq.id].map((match, idx) => (
                                  <div key={match.inventory_id} style={styles.matchCard}>
                                    <div style={styles.matchRank}>#{idx + 1}</div>
                                    {match.image_url && (
                                      <img
                                        src={`${import.meta.env.VITE_GATEWAY_URL}${match.image_url}`}
                                        alt="Match"
                                        style={styles.matchImage}
                                        onError={(e) => {
                                          e.target.style.display = 'none';
                                        }}
                                      />
                                    )}
                                    <div style={styles.matchInfo}>
                                      <p style={styles.matchDescription}>{match.description}</p>
                                      <div style={styles.matchDetails}>
                                        <span><strong>Color:</strong> {match.color}</span>
                                        <span><strong>Place:</strong> {match.place_lost}</span>
                                        <span><strong>Size:</strong> {match.size_category}</span>
                                      </div>
                                      <div style={styles.matchScores}>
                                        <div style={styles.scoreBar}>
                                          <span style={styles.scoreLabel}>Overall:</span>
                                          <div style={styles.scoreValue}>
                                            {(match.final_similarity * 100).toFixed(0)}%
                                          </div>
                                        </div>
                                        <div style={styles.scoreDetails}>
                                          <span>Text: {(match.text_similarity * 100).toFixed(0)}%</span>
                                          <span>Image: {(match.image_similarity * 100).toFixed(0)}%</span>
                                        </div>
                                      </div>
                                      <button
                                        onClick={() => handleMarkAsMatch(username, inq.id, match.inventory_id)}
                                        style={styles.markMatchButton}
                                      >
                                        Mark as Potential Match & Notify Student
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {matches[inq.id] && matches[inq.id].length === 0 && (
                            <div style={styles.noMatches}>
                              No inventory matches found (threshold: 30%)
                            </div>
                          )}
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
              {/* Add Inventory Form */}
              <div style={styles.formSection}>
                <h3 style={styles.sectionTitle}>Add New Inventory Item</h3>
                <form onSubmit={handleAddInventory} style={styles.form}>
                  <div style={styles.field}>
                    <label style={styles.label}>Description</label>
                    <textarea
                      placeholder="Describe the item..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows="3"
                      style={styles.textarea}
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Place Found</label>
                    <select
                      value={placeFound}
                      onChange={(e) => setPlaceFound(e.target.value)}
                      required
                      style={styles.input}
                    >
                      <option value="">Select building…</option>
                      <option value="B">B — B Annex</option>
                      <option value="CI">CI — CI Annex</option>
                      <option value="CL">CL — CL Annex</option>
                      <option value="D">D — D Annex</option>
                      <option value="EN">EN — EN Annex</option>
                      <option value="ER">ER — ER Building</option>
                      <option value="EV">EV — Engineering, Computer Science and Visual Arts Integrated Complex</option>
                      <option value="FA">FA — FA Annex</option>
                      <option value="FB">FB — Faubourg Building (1250 Guy St. + 1600 Ste-Catherine St. W.)</option>
                      <option value="FG">FG — Faubourg Ste-Catherine Building</option>
                      <option value="GA">GA — Grey Nuns Annex</option>
                      <option value="GM">GM — Guy-De Maisonneuve Building</option>
                      <option value="GN">GN — Grey Nuns Building (1190 Guy St. + 1175 St-Mathieu St.)</option>
                      <option value="GS">GS — GS Building</option>
                      <option value="H">H — Henry F. Hall Building</option>
                      <option value="K">K — K Annex</option>
                      <option value="LB">LB — J.W. McConnell Building</option>
                      <option value="LD">LD — LD Building</option>
                      <option value="LS">LS — Learning Square</option>
                      <option value="M">M — M Annex</option>
                      <option value="MB">MB — John Molson Building</option>
                      <option value="MI">MI — MI Annex</option>
                      <option value="MU">MU — MU Annex</option>
                      <option value="P">P — P Annex</option>
                      <option value="PR">PR — PR Annex</option>
                      <option value="Q">Q — Q Annex</option>
                      <option value="R">R — R Annex</option>
                      <option value="RR">RR — RR Annex</option>
                      <option value="S">S — S Annex</option>
                      <option value="SB">SB — Samuel Bronfman Building</option>
                      <option value="T">T — T Annex</option>
                      <option value="TD">TD — Toronto-Dominion Building</option>
                      <option value="V">V — V Annex</option>
                      <option value="VA">VA — Visual Arts Building</option>
                      <option value="X">X — X Annex</option>
                      <option value="Z">Z — Z Annex</option>
                    </select>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Date Found</label>
                    <input
                      type="date"
                      value={dateFound}
                      onChange={(e) => setDateFound(e.target.value)}
                      required
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Color</label>
                    <select
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      required
                      style={styles.input}
                    >
                      <option value="">Select color…</option>
                      <option value="Black">Black</option>
                      <option value="White">White</option>
                      <option value="Grey">Grey</option>
                      <option value="Blue">Blue</option>
                      <option value="Red">Red</option>
                      <option value="Green">Green</option>
                      <option value="Yellow">Yellow</option>
                      <option value="Pink">Pink</option>
                      <option value="Brown">Brown</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Approximate Cost</label>
                    <input
                      type="number"
                      placeholder="Enter cost"
                      value={cost}
                      onChange={(e) => setCost(e.target.value)}
                      required
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Size Category</label>
                    <select
                      value={sizeCategory}
                      onChange={(e) => setSizeCategory(e.target.value)}
                      required
                      style={styles.input}
                    >
                      <option value="">Select size…</option>
                      <option value="Small (keys, USB stick, AirPods)">Small (keys, USB stick, AirPods)</option>
                      <option value="Medium (phone, glasses case, power bank)">Medium (phone, glasses case, power bank)</option>
                      <option value="Large (laptop, tablet, backpack)">Large (laptop, tablet, backpack)</option>
                      <option value="Clothing Small">Clothing Small</option>
                      <option value="Clothing Medium">Clothing Medium</option>
                      <option value="Clothing Large or Bigger">Clothing Large or Bigger</option>
                    </select>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      required
                      style={styles.input}
                    >
                      <option value="submitted">Submitted</option>
                      <option value="under_review">Under Review</option>
                      <option value="matched">Matched</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>

                  <div style={styles.field}>
                    <label style={styles.label}>Image (optional)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImage(e.target.files[0])}
                      style={styles.input}
                    />
                  </div>

                  {formMessage && <div style={styles.successMsg}>{formMessage}</div>}
                  {formError && <div style={styles.errorMsg}>{formError}</div>}

                  <button type="submit" disabled={submitting} style={styles.submitButton}>
                    {submitting ? 'Adding...' : 'Add to Inventory'}
                  </button>
                </form>
              </div>

              {/* Inventory List */}
              <div style={styles.inventorySection}>
                <h3 style={styles.sectionTitle}>Inventory Items</h3>
                {inventory.length === 0 ? (
                  <div style={styles.emptyText}>No inventory items found.</div>
                ) : (
                  <div style={styles.inquiryList}>
                    {inventory.map((item) => (
                      <div key={item.id} style={styles.card}>
                        {editingItemId === item.id ? (
                          // Edit Mode
                          <div style={styles.editForm}>
                            <div style={styles.cardHeader}>
                              <span style={styles.cardId}>ID: {item.id.slice(0, 8)}...</span>
                              <div style={{display: 'flex', gap: '8px'}}>
                                <button
                                  onClick={() => handleUpdateItem(item.id)}
                                  style={styles.saveButton}
                                >
                                  Save All
                                </button>
                                <button
                                  onClick={() => setEditingItemId(null)}
                                  style={styles.cancelButton}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                            
                            <div style={styles.editFields}>
                              <div style={styles.field}>
                                <label style={styles.label}>Status</label>
                                <select
                                  value={editStatus}
                                  onChange={(e) => setEditStatus(e.target.value)}
                                  style={styles.input}
                                >
                                  <option value="submitted">Submitted</option>
                                  <option value="under_review">Under Review</option>
                                  <option value="matched">Matched</option>
                                  <option value="resolved">Resolved</option>
                                </select>
                              </div>
                              
                              <div style={styles.field}>
                                <label style={styles.label}>Description</label>
                                <textarea
                                  value={editDescription}
                                  onChange={(e) => setEditDescription(e.target.value)}
                                  style={styles.textarea}
                                  rows="3"
                                />
                              </div>
                              
                              <div style={styles.field}>
                                <label style={styles.label}>Color</label>
                                <select
                                  value={editColor}
                                  onChange={(e) => setEditColor(e.target.value)}
                                  style={styles.input}
                                >
                                  <option value="Black">Black</option>
                                  <option value="White">White</option>
                                  <option value="Grey">Grey</option>
                                  <option value="Blue">Blue</option>
                                  <option value="Red">Red</option>
                                  <option value="Green">Green</option>
                                  <option value="Yellow">Yellow</option>
                                  <option value="Pink">Pink</option>
                                  <option value="Brown">Brown</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                              
                              <div style={styles.field}>
                                <label style={styles.label}>Cost</label>
                                <input
                                  type="number"
                                  value={editCost}
                                  onChange={(e) => setEditCost(e.target.value)}
                                  style={styles.input}
                                />
                              </div>
                              
                              <div style={styles.field}>
                                <label style={styles.label}>Size Category</label>
                                <select
                                  value={editSize}
                                  onChange={(e) => setEditSize(e.target.value)}
                                  style={styles.input}
                                >
                                  <option value="Small">Small</option>
                                  <option value="Medium">Medium</option>
                                  <option value="Large">Large</option>
                                  <option value="Clothing Small">Clothing Small</option>
                                  <option value="Clothing Medium">Clothing Medium</option>
                                  <option value="Clothing Large or Bigger">Clothing Large or Bigger</option>
                                </select>
                              </div>
                              
                              <div style={styles.field}>
                                <label style={styles.label}>Place Found</label>
                                <input
                                  type="text"
                                  value={editPlace}
                                  onChange={(e) => setEditPlace(e.target.value)}
                                  style={styles.input}
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          // View Mode
                          <>
                            <div style={styles.cardHeader}>
                              <span style={styles.cardId}>ID: {item.id.slice(0, 8)}...</span>
                              <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                <span style={styles.status}>{item.status}</span>
                                <button
                                  onClick={() => {
                                    setEditingItemId(item.id);
                                    setEditStatus(item.status);
                                    setEditDescription(item.description);
                                    setEditColor(item.color);
                                    setEditCost(item.approx_cost);
                                    setEditSize(item.size_category);
                                    setEditPlace(item.place_lost);
                                  }}
                                  style={styles.editButton}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  style={styles.deleteButton}
                                >
                                  Delete
                                </button>
                              </div>
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
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
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
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px'
  },
  card: {
    border: '1px solid #e8e8e8',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: 'white',
    display: 'flex',
    flexDirection: 'column',
    height: '100%'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f8f9fa',
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
    gap: '12px',
    padding: '16px',
    flex: '1'
  },
  image: {
    width: '100%',
    height: '200px',
    backgroundColor: '#f0f0f0',
    marginBottom: '12px',
    objectFit: 'contain'
  },
  description: {
    margin: 0,
    fontSize: '14px',
    color: '#333',
    lineHeight: '1.5'
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '13px',
    color: '#666',
    marginTop: 'auto'
  },
  timestamp: {
    fontSize: '11px',
    color: '#999'
  },
  statusUpdate: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e8e8e8'
  },
  statusLabel: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#333'
  },
  statusSelect: {
    padding: '6px 12px',
    fontSize: '13px',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    flex: '1'
  },
  emailSentBadge: {
    fontSize: '11px',
    color: '#52c41a',
    backgroundColor: '#f6ffed',
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid #b7eb8f'
  },
  formSection: {
    padding: '24px',
    backgroundColor: '#f9f9f9',
    borderRadius: '6px',
    marginBottom: '32px'
  },
  inventorySection: {
    padding: '24px',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    border: '1px solid #e8e8e8'
  },
  sectionTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    fontWeight: '500',
    color: '#333'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#333'
  },
  input: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    outline: 'none',
    fontFamily: 'inherit'
  },
  textarea: {
    padding: '10px 12px',
    fontSize: '14px',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  submitButton: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#0a6ed1',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  successMsg: {
    padding: '12px',
    backgroundColor: '#f6ffed',
    border: '1px solid #b7eb8f',
    borderRadius: '4px',
    color: '#389e0d',
    fontSize: '13px'
  },
  errorMsg: {
    padding: '12px',
    backgroundColor: '#fff1f0',
    border: '1px solid #ffccc7',
    borderRadius: '4px',
    color: '#cf1322',
    fontSize: '13px'
  },
  editButton: {
    padding: '4px 12px',
    fontSize: '11px',
    fontWeight: '500',
    color: '#0a6ed1',
    backgroundColor: 'transparent',
    border: '1px solid #0a6ed1',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  deleteButton: {
    padding: '4px 12px',
    fontSize: '11px',
    fontWeight: '500',
    color: '#ff4d4f',
    backgroundColor: 'transparent',
    border: '1px solid #ff4d4f',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  saveButton: {
    padding: '4px 12px',
    fontSize: '11px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#52c41a',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  cancelButton: {
    padding: '4px 12px',
    fontSize: '11px',
    fontWeight: '500',
    color: '#666',
    backgroundColor: '#f5f5f5',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  editFields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  inquiryWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  processButton: {
    width: '100%',
    padding: '10px',
    fontSize: '13px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#722ed1',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'background-color 0.2s'
  },
  matchesSection: {
    padding: '16px',
    backgroundColor: '#f0f5ff',
    border: '2px solid #adc6ff',
    borderRadius: '8px'
  },
  matchesTitle: {
    margin: '0 0 12px 0',
    fontSize: '14px',
    fontWeight: '500',
    color: '#1d39c4'
  },
  matchesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  matchCard: {
    display: 'flex',
    gap: '12px',
    padding: '12px',
    backgroundColor: 'white',
    border: '1px solid #d9d9d9',
    borderRadius: '6px',
    position: 'relative'
  },
  matchRank: {
    position: 'absolute',
    top: '8px',
    left: '8px',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#1890ff',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    fontWeight: '600'
  },
  matchImage: {
    width: '120px',
    height: '120px',
    objectFit: 'contain',
    borderRadius: '4px',
    backgroundColor: '#f0f0f0',
    flexShrink: 0
  },
  matchInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  matchDescription: {
    margin: 0,
    fontSize: '13px',
    color: '#333',
    lineHeight: '1.4'
  },
  matchDetails: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    fontSize: '12px',
    color: '#666'
  },
  matchScores: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '8px',
    backgroundColor: '#fafafa',
    borderRadius: '4px'
  },
  scoreBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  scoreLabel: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#333'
  },
  scoreValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1890ff'
  },
  scoreDetails: {
    display: 'flex',
    gap: '16px',
    fontSize: '11px',
    color: '#666'
  },
  markMatchButton: {
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#52c41a',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    alignSelf: 'flex-start'
  },
  noMatches: {
    padding: '16px',
    textAlign: 'center',
    backgroundColor: '#fff7e6',
    border: '1px solid #ffd591',
    borderRadius: '6px',
    color: '#ad6800',
    fontSize: '13px'
  }
};
