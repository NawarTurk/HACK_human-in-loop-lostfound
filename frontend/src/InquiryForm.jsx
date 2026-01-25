import { useState, useEffect } from 'react';

export default function InquiryForm({ user }) {
  const [description, setDescription] = useState('');
  const [dateLost, setDateLost] = useState('');
  const [placeLost, setPlaceLost] = useState('');
  const [color, setColor] = useState('');
  const [cost, setCost] = useState('');
  const [sizeCategory, setSizeCategory] = useState('');
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [inquiries, setInquiries] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  // Fetch user's inquiries on mount
  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    setLoadingList(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_GATEWAY_URL}/inquiry/list`, {
        method: 'GET',
        credentials: 'include'
      });

      const data = await response.json();
      if (response.ok && data.status === 'ok') {
        setInquiries(data.inquiries || []);
      }
    } catch (err) {
      console.error('Failed to fetch inquiries:', err);
    } finally {
      setLoadingList(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('username', user.username);
      formData.append('description', description);
      formData.append('date_lost', dateLost);
      formData.append('place_lost', placeLost);
      formData.append('color', color);
      formData.append('cost', cost);
      formData.append('size_category', sizeCategory);
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
        setMessage(data.message || 'Inquiry submitted successfully!');
        // Clear form
        setDescription('');
        setDateLost('');
        setPlaceLost('');
        setColor('');
        setCost('');
        setSizeCategory('');
        setImage(null);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
        
        // Refresh inquiry list
        fetchInquiries();
      } else {
        setError(data.message || 'Failed to submit inquiry');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Inquiry List Section */}
      <div style={styles.listSection}>
        <h3 style={styles.title}>Your Lost Item Reports</h3>
        
        {loadingList ? (
          <div style={styles.loadingText}>Loading your inquiries...</div>
        ) : inquiries.length === 0 ? (
          <div style={styles.emptyText}>No inquiries yet. Submit your first report below.</div>
        ) : (
          <div style={styles.inquiryList}>
            {inquiries.map((inq) => (
              <div key={inq.id} style={styles.inquiryCard}>
                <div style={styles.inquiryHeader}>
                  <span style={styles.inquiryId}>ID: {inq.id.slice(0, 8)}...</span>
                  <span style={styles.inquiryStatus}>{inq.status}</span>
                </div>
                <div style={styles.inquiryBody}>
                  {inq.image_url && (
                    <img 
                      src={`${import.meta.env.VITE_GATEWAY_URL}${inq.image_url}`}
                      alt="Lost item"
                      style={styles.inquiryImage}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'block';
                      }}
                    />
                  )}
                  {inq.image_url && (
                    <div style={{...styles.imagePlaceholder, display: 'none'}}>
                      📷 Image unavailable
                    </div>
                  )}
                  <p style={styles.inquiryDescription}>{inq.description}</p>
                  <div style={styles.inquiryDetails}>
                    <span><strong>Date Lost:</strong> {inq.date_lost}</span>
                    <span><strong>Place:</strong> {inq.place_lost}</span>
                    <span><strong>Color:</strong> {inq.color}</span>
                    <span><strong>Cost:</strong> ${inq.approx_cost}</span>
                    <span><strong>Size:</strong> {inq.size_category}</span>
                  </div>
                  <div style={styles.inquiryTimestamp}>
                    Submitted: {new Date(inq.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Section */}
      <div style={styles.formSection}>
        <h3 style={styles.title}>Report New Lost Item</h3>
        
        <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.field}>
          <label style={styles.label}>Description</label>
          <textarea
            placeholder="What did you lose?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows="4"
            style={styles.textarea}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Date Lost</label>
          <input
            type="date"
            value={dateLost}
            onChange={(e) => setDateLost(e.target.value)}
            required
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Place Lost</label>
          <select
            value={placeLost}
            onChange={(e) => setPlaceLost(e.target.value)}
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
            <option value="Small">Small (keys, USB stick, AirPods)</option>
            <option value="Medium">Medium (phone, glasses case, power bank)</option>
            <option value="Large">Large (laptop, tablet, backpack)</option>
            <option value="Clothing Small">Clothing Small</option>
            <option value="Clothing Medium">Clothing Medium</option>
            <option value="Clothing Large or Bigger">Clothing Large or Bigger</option>
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

        {message && <div style={styles.success}>{message}</div>}
        {error && <div style={styles.error}>{error}</div>}

        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? 'Submitting...' : 'Submit Inquiry'}
        </button>
      </form>
      </div>
    </div>
  );
}

const styles = {
  container: {
    marginTop: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px'
  },
  listSection: {
    padding: '32px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  formSection: {
    padding: '32px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  title: {
    margin: '0 0 24px 0',
    fontSize: '20px',
    fontWeight: '300',
    color: '#0a6ed1'
  },
  loadingText: {
    padding: '24px',
    textAlign: 'center',
    color: '#666',
    fontSize: '14px'
  },
  emptyText: {
    padding: '24px',
    textAlign: 'center',
    color: '#999',
    fontSize: '14px',
    fontStyle: 'italic'
  },
  inquiryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  inquiryCard: {
    border: '1px solid #e8e8e8',
    borderRadius: '6px',
    padding: '16px',
    backgroundColor: '#fafafa',
    transition: 'box-shadow 0.2s',
    cursor: 'default'
  },
  inquiryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e8e8e8'
  },
  inquiryId: {
    fontSize: '12px',
    color: '#666',
    fontFamily: 'monospace'
  },
  inquiryStatus: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#0a6ed1',
    backgroundColor: '#e6f7ff',
    padding: '4px 12px',
    borderRadius: '12px',
    textTransform: 'capitalize'
  },
  inquiryBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  inquiryImage: {
    width: '100%',
    maxWidth: '300px',
    height: 'auto',
    borderRadius: '4px',
    marginBottom: '8px',
    objectFit: 'cover'
  },
  imagePlaceholder: {
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    color: '#999',
    textAlign: 'center',
    fontSize: '13px',
    marginBottom: '8px'
  },
  inquiryDescription: {
    margin: 0,
    fontSize: '14px',
    color: '#333',
    lineHeight: '1.5'
  },
  inquiryDetails: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    fontSize: '13px',
    color: '#666'
  },
  inquiryTimestamp: {
    fontSize: '11px',
    color: '#999',
    marginTop: '4px'
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
    fontSize: '14px',
    fontWeight: '500',
    color: '#333'
  },
  input: {
    padding: '12px 16px',
    fontSize: '14px',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit'
  },
  textarea: {
    padding: '12px 16px',
    fontSize: '14px',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    outline: 'none',
    transition: 'border-color 0.2s',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  button: {
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    color: 'white',
    backgroundColor: '#0a6ed1',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    marginTop: '8px'
  },
  success: {
    padding: '12px',
    backgroundColor: '#f6ffed',
    border: '1px solid #b7eb8f',
    borderRadius: '4px',
    color: '#389e0d',
    fontSize: '14px'
  },
  error: {
    padding: '12px',
    backgroundColor: '#fff1f0',
    border: '1px solid #ffccc7',
    borderRadius: '4px',
    color: '#cf1322',
    fontSize: '14px'
  }
};
