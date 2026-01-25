import { useState } from 'react';

export default function InquiryForm({ user }) {
  const [description, setDescription] = useState('');
  const [dateLost, setDateLost] = useState('');
  const [placeLost, setPlaceLost] = useState('');
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
        setImage(null);
        // Reset file input
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
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
      <h3 style={styles.title}>Report Lost Item</h3>
      
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
  title: {
    margin: '0 0 24px 0',
    fontSize: '20px',
    fontWeight: '300',
    color: '#0a6ed1'
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
