import { Lead, Note } from '../models/index.js';
import { Op } from 'sequelize';

// Get all leads with search and filter
export const getLeads = async (req, res) => {
  try {
    const { search, status, source, sortBy, order } = req.query;

    const whereClause = {};

    // Apply search query (checks name, email, company, and message)
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { company: { [Op.like]: `%${search}%` } },
        { message: { [Op.like]: `%${search}%` } }
      ];
    }

    // Apply status filter
    if (status && status !== 'All') {
      whereClause.status = status;
    }

    // Apply source filter
    if (source && source !== 'All') {
      whereClause.source = source;
    }

    // Sorting parameters
    const activeSortBy = sortBy || 'createdAt';
    const activeOrder = order === 'asc' ? 'ASC' : 'DESC';

    const leads = await Lead.findAll({
      where: whereClause,
      order: [[activeSortBy, activeOrder]],
      include: [{ model: Note, limit: 1, order: [['createdAt', 'DESC']] }] // Include last note for quick preview
    });

    return res.status(200).json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return res.status(500).json({ message: 'Error retrieving leads', error: error.message });
  }
};

// Get single lead with full notes history
export const getLeadById = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findByPk(id, {
      include: [{ model: Note, order: [['createdAt', 'DESC']] }]
    });

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // Sort notes in memory descending (Sequelize include ordering can sometimes behave oddly with SQLite relations)
    const sortedNotes = lead.Notes ? [...lead.Notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : [];
    
    const leadData = lead.toJSON();
    leadData.Notes = sortedNotes;

    return res.status(200).json(leadData);
  } catch (error) {
    console.error('Error fetching lead details:', error);
    return res.status(500).json({ message: 'Error retrieving lead details', error: error.message });
  }
};

// Create a new lead (e.g. from public contact form or CRM manual entry)
export const createLead = async (req, res) => {
  try {
    const { name, email, phone, company, message, source, value, status } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'Name and Email are required fields' });
    }

    const newLead = await Lead.create({
      name,
      email,
      phone,
      company,
      message,
      source: source || 'Website Contact Form',
      value: value || 0.00,
      status: status || 'New'
    });

    // Create an automatic initial log note
    await Note.create({
      content: `Lead created successfully via ${newLead.source}. Initial status: ${newLead.status}.`,
      author: 'System Autolog',
      LeadId: newLead.id
    });

    return res.status(201).json(newLead);
  } catch (error) {
    console.error('Error creating lead:', error);
    return res.status(500).json({ message: 'Error creating lead', error: error.message });
  }
};

// Update an existing lead (and log status transitions)
export const updateLead = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, company, message, status, value, source } = req.body;

    const lead = await Lead.findByPk(id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const previousStatus = lead.status;
    const previousValue = lead.value;

    // Update lead attributes
    lead.name = name !== undefined ? name : lead.name;
    lead.email = email !== undefined ? email : lead.email;
    lead.phone = phone !== undefined ? phone : lead.phone;
    lead.company = company !== undefined ? company : lead.company;
    lead.message = message !== undefined ? message : lead.message;
    lead.status = status !== undefined ? status : lead.status;
    lead.value = value !== undefined ? value : lead.value;
    lead.source = source !== undefined ? source : lead.source;

    await lead.save();

    // Check if status changed to log a transition note
    if (status && status !== previousStatus) {
      await Note.create({
        content: `Lead status transitioned from "${previousStatus}" to "${status}".`,
        author: 'System Autolog',
        LeadId: lead.id
      });
    }

    // Check if value changed to log a transition note
    if (value !== undefined && parseFloat(value) !== parseFloat(previousValue)) {
      await Note.create({
        content: `Lead estimated pipeline value updated from ₹${parseFloat(previousValue).toFixed(2)} to ₹${parseFloat(value).toFixed(2)}.`,
        author: 'System Autolog',
        LeadId: lead.id
      });
    }

    return res.status(200).json(lead);
  } catch (error) {
    console.error('Error updating lead:', error);
    return res.status(500).json({ message: 'Error updating lead', error: error.message });
  }
};

// Delete a lead
export const deleteLead = async (req, res) => {
  try {
    const { id } = req.params;
    const lead = await Lead.findByPk(id);

    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    await lead.destroy(); // Notes cascade-delete automatically due to Sequelize configuration
    return res.status(200).json({ message: 'Lead and associated notes deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return res.status(500).json({ message: 'Error deleting lead', error: error.message });
  }
};

// Add a note to a lead
export const addNote = async (req, res) => {
  try {
    const { id } = req.params; // LeadId
    const { content, author } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Note content is required' });
    }

    const lead = await Lead.findByPk(id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    const note = await Note.create({
      content,
      author: author || 'CRM Administrator',
      LeadId: lead.id
    });

    return res.status(201).json(note);
  } catch (error) {
    console.error('Error adding note:', error);
    return res.status(500).json({ message: 'Error creating note', error: error.message });
  }
};

// Delete a note
export const deleteNote = async (req, res) => {
  try {
    const { id } = req.params; // NoteId
    const note = await Note.findByPk(id);

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    await note.destroy();
    return res.status(200).json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    return res.status(500).json({ message: 'Error deleting note', error: error.message });
  }
};

// Seed realistic mock data
export const seedDemoLeads = async (req, res) => {
  try {
    // Check if leads already exist
    const count = await Lead.count();
    if (count > 0) {
      return res.status(200).json({ message: 'Database already has data. Seeding skipped.' });
    }

    // Create high-quality mock leads
    const mockLeads = [
      {
        name: 'Sarah Jenkins',
        email: 'sarah.j@nexustech.io',
        phone: '+1 (555) 234-5678',
        company: 'Nexus Tech Solutions',
        message: 'Looking for a custom enterprise CRM dashboard integration. We have around 50 agents and need support for real-time contact feeds.',
        source: 'Website Contact Form',
        value: 8500.00,
        status: 'New'
      },
      {
        name: 'Michael Chen',
        email: 'mchen@apexdesign.co',
        phone: '+1 (555) 876-5432',
        company: 'Apex Design Agency',
        message: 'Interested in your high-end retainer design package. We need support launching 3 products this quarter and require rapid turnarounds.',
        source: 'Landing Page Form',
        value: 4200.00,
        status: 'Contacted'
      },
      {
        name: 'Elena Rostova',
        email: 'elena.rostova@nordiclight.se',
        phone: '+46 8 123 45 67',
        company: 'Nordic Light Logistics',
        message: 'Can you provide a quote for migrating our legacy database to cloud services? Security and high uptime are top priorities.',
        source: 'Website Contact Form',
        value: 15000.00,
        status: 'Qualified'
      },
      {
        name: 'David Miller',
        email: 'd.miller@quantumgrowth.com',
        phone: '+1 (555) 456-7890',
        company: 'Quantum Growth Partners',
        message: 'We saw your marketing analytics case study. We are interested in setting up a similar reporting and automation hub for our sales team.',
        source: 'Referral Webhook',
        value: 6800.00,
        status: 'Proposal Sent'
      },
      {
        name: 'Olivia Martinez',
        email: 'olivia@brightmedia.com',
        phone: '+1 (555) 987-6543',
        company: 'Bright Media Group',
        message: 'Need a team to build a headless e-commerce store with Shopify integration and high performance SEO scores.',
        source: 'Website Contact Form',
        value: 12500.00,
        status: 'Won'
      },
      {
        name: 'James O\'Connor',
        email: 'joconnor@iristravel.ie',
        phone: '+353 1 496 0123',
        company: 'Iris Travel Co.',
        message: 'Looking to build a custom booking plugin for our local tour agency site. Budget is tightly restricted to under $1000.',
        source: 'Website Contact Form',
        value: 800.00,
        status: 'Lost'
      }
    ];

    for (const data of mockLeads) {
      const lead = await Lead.create(data);
      
      // Add custom chronological history for some leads to make the CRM feel organic
      await Note.create({
        content: `Lead ingested automatically via ${lead.source}. Initial stage set to "${lead.status}".`,
        author: 'System Autolog',
        LeadId: lead.id,
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000) // 2 days ago
      });

      if (lead.status !== 'New') {
        await Note.create({
          content: `Initial client inquiry call conducted. Outlined general requirements. Customer verified their estimated value is around ₹${lead.value}.`,
          author: 'CRM Administrator',
          LeadId: lead.id,
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
        });
      }

      if (lead.status === 'Qualified' || lead.status === 'Proposal Sent' || lead.status === 'Won') {
        await Note.create({
          content: `Qualified lead. Passed general budget threshold. Preparing custom technical proposal package.`,
          author: 'Sales Consultant',
          LeadId: lead.id,
          createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000)
        });
      }

      if (lead.status === 'Proposal Sent') {
        await Note.create({
          content: `Sent enterprise proposal package via email. Awaiting review by executive stakeholders.`,
          author: 'Sales Consultant',
          LeadId: lead.id,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000)
        });
      }

      if (lead.status === 'Won') {
        await Note.create({
          content: `Contract signed! Received advance retainer deposit. Initial onboarding scheduled. Handing over to project delivery team.`,
          author: 'Sales Consultant',
          LeadId: lead.id,
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
        });
      }

      if (lead.status === 'Lost') {
        await Note.create({
          content: `Lost lead: Budget constraints on client side are too rigid. They cannot support our platform costs. Closing ticket.`,
          author: 'CRM Administrator',
          LeadId: lead.id,
          createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000)
        });
      }
    }

    return res.status(201).json({ message: 'Database successfully seeded with beautiful demo leads!' });
  } catch (error) {
    console.error('Error seeding demo data:', error);
    return res.status(500).json({ message: 'Error seeding database', error: error.message });
  }
};
