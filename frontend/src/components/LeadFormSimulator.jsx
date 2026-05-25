import React, { useState } from 'react';

export default function LeadFormSimulator() {
  // Simulator form state
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: ''
  });

  const [simulatedSource, setSimulatedSource] = useState('Website Contact Form');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Submit simulated contact form directly to Express backend webhook
  const handleSimulatedSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;

    try {
      setLoading(true);
      const res = await fetch('/api/leads/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          source: simulatedSource,
          status: 'New',
          value: 0.00 // Default initial estimated value
        })
      });

      if (!res.ok) throw new Error('API server rejected submission');
      
      setSuccess(true);
      // Clear form
      setForm({
        name: '',
        email: '',
        phone: '',
        company: '',
        message: ''
      });

      // Dispatch global sync notification to reload dashboard/leads in other tabs!
      window.dispatchEvent(new CustomEvent('crm-lead-updated'));

      // Clear success banner after 5 seconds
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      alert(`Simulation Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Website copyable integration snippet
  const embedCodeSnippet = `<!-- CRM Contact Form Ingestion Snippet -->
<form id="crm-contact-form" class="client-form">
  <div class="form-row">
    <div class="form-field">
      <label for="client-name">Full Name *</label>
      <input type="text" id="client-name" name="name" required placeholder="e.g. Alex Mercer">
    </div>
  </div>

  <div class="form-row split">
    <div class="form-field">
      <label for="client-email">Email Address *</label>
      <input type="email" id="client-email" name="email" required placeholder="alex@mercer.com">
    </div>
    <div class="form-field">
      <label for="client-phone">Phone Number</label>
      <input type="text" id="client-phone" name="phone" placeholder="+1 (555) 123-4567">
    </div>
  </div>

  <div class="form-row">
    <div class="form-field">
      <label for="client-company">Company</label>
      <input type="text" id="client-company" name="company" placeholder="Mercer Tech Labs">
    </div>
  </div>

  <div class="form-row">
    <div class="form-field">
      <label for="client-message">How can we help? *</label>
      <textarea id="client-message" name="message" required rows="4" placeholder="Briefly describe your project goals..."></textarea>
    </div>
  </div>

  <button type="submit" id="crm-submit-btn">Send Message</button>
  <div id="crm-alert-box" class="alert-box" style="display:none;"></div>
</form>

<style>
  /* Premium Embedded Stylesheet */
  .client-form {
    font-family: system-ui, -apple-system, sans-serif;
    max-width: 440px;
    background: #ffffff;
    padding: 28px;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
    border: 1px solid #e5e7eb;
  }
  .form-row { margin-bottom: 16px; }
  .form-row.split { display: flex; gap: 12px; }
  .form-field { display: flex; flex-direction: column; width: 100%; }
  .form-field label { font-size: 0.75rem; font-weight: 700; color: #374151; margin-bottom: 6px; text-transform: uppercase; }
  .form-field input, .form-field textarea { padding: 10px 14px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 0.85rem; outline: none; background: #f9fafb; transition: all 0.2s; }
  .form-field input:focus, .form-field textarea:focus { border-color: #2563eb; background: #ffffff; box-shadow: 0 0 0 3px rgba(37,99,235,0.15); }
  #crm-submit-btn { width: 100%; padding: 12px; background: #2563eb; color: #ffffff; border: none; border-radius: 6px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
  #crm-submit-btn:hover { background: #1d4ed8; }
  .alert-box { margin-top: 14px; padding: 10px 14px; border-radius: 6px; font-size: 0.8rem; text-align: center; }
  .alert-box.success { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; }
  .alert-box.error { background: #fef2f2; border: 1px solid #fca5a5; color: #991b1b; }
</style>

<script>
  document.getElementById('crm-contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('crm-submit-btn');
    const alertBox = document.getElementById('crm-alert-box');
    
    btn.disabled = true;
    btn.innerText = 'Submitting...';
    
    const payload = {
      name: document.getElementById('client-name').value,
      email: document.getElementById('client-email').value,
      phone: document.getElementById('client-phone').value,
      company: document.getElementById('client-company').value,
      message: document.getElementById('client-message').value,
      source: 'Website Contact Page' // Tracks where leads generate
    };

    try {
      // Points directly to the Express server webhook API
      const res = await fetch('http://localhost:5000/api/leads/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error('Ingestion service returned error');
      
      alertBox.className = 'alert-box success';
      alertBox.innerText = '✓ Thank you! Your message was submitted successfully.';
      alertBox.style.display = 'block';
      document.getElementById('crm-contact-form').reset();
    } catch (err) {
      alertBox.className = 'alert-box error';
      alertBox.innerText = '✕ Error: Could not connect to database ingestion API.';
      alertBox.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.innerText = 'Send Message';
    }
  });
<\/script>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCodeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div className="simulator-layout">
        {/* Left Side: Mock Website Browser frame */}
        <div className="website-preview-frame">
          <div className="frame-browser-bar">
            <span className="browser-dot red" />
            <span className="browser-dot yellow" />
            <span className="browser-dot green" />
            <div className="browser-address">http://yourdomain.com/contact-us</div>
          </div>
          
          <div className="frame-content">
            <h3 className="simulated-title">Partner With Us</h3>
            <p className="simulated-desc">
              Have an enterprise project or request? Fill out our form below and a representative will connect with you.
            </p>

            <form onSubmit={handleSimulatedSubmit} className="simulated-form">
              <div>
                <label>Full Name *</label>
                <input 
                  type="text" 
                  name="name"
                  required
                  placeholder="e.g. Tony Stark"
                  value={form.name}
                  onChange={handleInputChange}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div>
                  <label>Email *</label>
                  <input 
                    type="email" 
                    name="email"
                    required
                    placeholder="tony@stark.com"
                    value={form.email}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <label>Phone</label>
                  <input 
                    type="text" 
                    name="phone"
                    placeholder="+1 (555) 3000"
                    value={form.phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label>Company</label>
                <input 
                  type="text" 
                  name="company"
                  placeholder="Stark Enterprises"
                  value={form.company}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label>Inquiry Message *</label>
                <textarea 
                  name="message"
                  required
                  rows="3"
                  placeholder="Describe your development needs..."
                  value={form.message}
                  onChange={handleInputChange}
                />
              </div>

              <button type="submit" disabled={loading}>
                {loading ? 'Transmitting inquiry...' : 'Submit Inquiry'}
              </button>

              {success && (
                <div className="submission-success-banner">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <strong>Inquiry Sent!</strong> Checked in successfully. Check your CRM Dashboard to view in real-time!
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Right Side: Setup Instructions & Code Snippet Box */}
        <div className="snippet-panel glass-panel">
          <h3 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" width="22" height="22" style={{ color: 'hsl(var(--accent-primary))' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.25 9.75 16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" />
            </svg>
            Website Lead Ingestion Snippet
          </h3>
          
          <p className="snippet-instructions">
            Integrate this CRM instantly with any custom HTML website. Copy the embed snippet below, place it in your website code, and all contact submissions will automatically feed directly into this system.
          </p>

          <div className="form-group" style={{ margin: '0' }}>
            <label style={{ color: 'hsl(var(--text-secondary))' }}>Simulate Submitting As Source</label>
            <select 
              className="filter-select"
              style={{ width: '100%', marginTop: '4px' }}
              value={simulatedSource}
              onChange={(e) => setSimulatedSource(e.target.value)}
            >
              <option value="Website Contact Form">Website Contact Page Form</option>
              <option value="Landing Page Form">Landing Page Marketing Form</option>
              <option value="Referral Webhook">Referral Partner Webhook</option>
            </select>
          </div>

          <div className="code-box-container">
            <div className="code-box-header">
              <span className="code-box-title">
                HTML / CSS / JavaScript Embed Code
              </span>
              <button onClick={copyToClipboard} className="copy-btn">
                {copied ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.009-.032.018-.063.026-.096m-7.358 0a2.203 2.203 0 0 1-.026-.096m13.72 10.5v-9a2.25 2.25 0 0 0-2.25-2.25h-9a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25Z" />
                    </svg>
                    Copy Snippet
                  </>
                )}
              </button>
            </div>
            
            <pre className="code-snippet-box">
              <code>{embedCodeSnippet}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
