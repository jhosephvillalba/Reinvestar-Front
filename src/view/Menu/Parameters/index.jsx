import React, { useState, useEffect } from 'react';
import styles from './style.module.css';
import Notification from '../../../components/Notification';
import { createCompany, getCompanies, updateCompany, deleteCompany } from '../../../Api/admin';
import { getTypesDocument, createTypeDocument, updateTypeDocument, deleteTypeDocument } from '../../../Api/typesDocument';
import * as emailTemplateApi from '../../../Api/emailTemplate';

const Parameters = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('general');

  const [params, setParams] = useState({
    general: {
      defaultCurrency: 'USD',
      dateFormat: 'MM/DD/YYYY',
      timeZone: 'America/New_York'
    },
    dscr: {
      minAmount: '',
      maxAmount: '',
      minRatio: ''
    },
    fixflip: {
      minAmount: '',
      maxAmount: '',
      maxLTV: ''
    },
    construction: {
      minAmount: '',
      maxAmount: '',
      maxTerm: ''
    },
    documents: {
      maxSize: '',
      allowedFormats: '',
      requiredDocs: ''
    }
  });

  const [companies, setCompanies] = useState([]);
  const [newCompany, setNewCompany] = useState({
    name: '',
    description: '',
    status: true
  });
  const [editingCompany, setEditingCompany] = useState(null);
  const [loading, setLoading] = useState(false);

  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success'
  });

  // New states for document types
  const [documentTypes, setDocumentTypes] = useState([]);
  const [newDocumentType, setNewDocumentType] = useState({
    name: ''
  });
  const [editingDocumentType, setEditingDocumentType] = useState(null);

  // New states for email templates
  const [emailTemplates, setEmailTemplates] = useState([]);
  const [templateTypes, setTemplateTypes] = useState([]);
  // Modify newTemplate state to also serve for editing
  const [templateForm, setTemplateForm] = useState({
    id: null,
    name: '',
    description: '',
    subject: '',
    content: '',
    template_type: '',
    is_active: true
  });
  const [isEditing, setIsEditing] = useState(false);

  // State for preview modal
  const [previewModal, setPreviewModal] = useState({
    show: false,
    data: null
  });

  const resetTemplateForm = () => {
    setTemplateForm({
      id: null,
      name: '',
      description: '',
      subject: '',
      content: '',
      template_type: '',
      is_active: true
    });
    setIsEditing(false);
  };

  useEffect(() => {
    loadCompanies();
    loadDocumentTypes();
    loadEmailTemplates();
    loadTemplateTypes();
    const savedParams = localStorage.getItem('appParameters');
    if (savedParams) {
      setParams(JSON.parse(savedParams));
    }
  }, []);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      const data = await getCompanies();
      setCompanies(data);
    } catch (error) {
      setNotification({
        show: true,
        message: 'Error loading companies: ' + error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentTypes = async () => {
    try {
      setLoading(true);
      const data = await getTypesDocument();
      // Handle new data structure with items, total, page, etc.
      if (data && data.items && Array.isArray(data.items)) {
        setDocumentTypes(data.items);
      } else if (Array.isArray(data)) {
        setDocumentTypes(data);
      } else {
        setDocumentTypes([]);
      }
    } catch (error) {
      setNotification({
        show: true,
        message: 'Error loading document types: ' + error.message,
        type: 'error'
      });
      setDocumentTypes([]); // Set empty array in case of error
    } finally {
      setLoading(false);
    }
  };

  const loadEmailTemplates = async () => {
    try {
      setLoading(true);
      const data = await emailTemplateApi.getEmailTemplates();
      // Ensure data is always an array
      setEmailTemplates(Array.isArray(data) ? data : []);
    } catch (error) {
      setNotification({
        show: true,
        message: 'Error loading email templates: ' + error.message,
        type: 'error'
      });
      setEmailTemplates([]); // Set empty array in case of error
    } finally {
      setLoading(false);
    }
  };

  const loadTemplateTypes = async () => {
    try {
      const types = await emailTemplateApi.getAvailableTemplateTypes();
      // Ensure types is always an array
      setTemplateTypes(Array.isArray(types) ? types : []);
    } catch (error) {
      console.error('Error loading template types:', error);
      setTemplateTypes([]); // Set empty array in case of error
    }
  };

  const handleChange = (section, field, value) => {
    setParams(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = () => {
    localStorage.setItem('appParameters', JSON.stringify(params));
    setNotification({
      show: true,
      message: 'Parameters saved successfully',
      type: 'success'
    });
  };

  const handleCancel = () => {
    const savedParams = localStorage.getItem('appParameters');
    if (savedParams) {
      setParams(JSON.parse(savedParams));
    }
    setNotification({
      show: true,
      message: 'Changes discarded',
      type: 'info'
    });
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createCompany(newCompany);
      setNotification({
        show: true,
        message: 'Company created successfully',
        type: 'success'
      });
      setNewCompany({ name: '', description: '', status: true });
      loadCompanies();
    } catch (error) {
      setNotification({
        show: true,
        message: 'Error creating company: ' + error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCompany = async (companyId) => {
    try {
      setLoading(true);
      await updateCompany(companyId, editingCompany);
      setNotification({
        show: true,
        message: 'Company updated successfully',
        type: 'success'
      });
      setEditingCompany(null);
      loadCompanies();
    } catch (error) {
      setNotification({
        show: true,
        message: 'Error updating company: ' + error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCompany = async (companyId) => {
    if (!window.confirm('Are you sure you want to delete this company?')) return;
    try {
      setLoading(true);
      await deleteCompany(companyId);
      setNotification({
        show: true,
        message: 'Company deleted successfully',
        type: 'success'
      });
      loadCompanies();
    } catch (error) {
      setNotification({
        show: true,
        message: 'Error deleting company: ' + error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocumentType = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await createTypeDocument(newDocumentType);
      setNotification({
        show: true,
        message: 'Document type created successfully',
        type: 'success'
      });
      setNewDocumentType({ name: '' });
      loadDocumentTypes();
    } catch (error) {
      setNotification({
        show: true,
        message: 'Error creating document type: ' + error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDocumentType = async (typeId) => {
    try {
      setLoading(true);
      // Only send the name field which is available
      const updateData = { name: editingDocumentType.name };
      await updateTypeDocument(typeId, updateData);
      setNotification({
        show: true,
        message: 'Document type updated successfully',
        type: 'success'
      });
      setEditingDocumentType(null);
      loadDocumentTypes();
    } catch (error) {
      setNotification({
        show: true,
        message: 'Error updating document type: ' + error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocumentType = async (typeId) => {
    if (!window.confirm('Are you sure you want to delete this document type?')) return;
    try {
      setLoading(true);
      await deleteTypeDocument(typeId);
      setNotification({
        show: true,
        message: 'Document type deleted successfully',
        type: 'success'
      });
      loadDocumentTypes();
    } catch (error) {
      setNotification({
        show: true,
        message: 'Error deleting document type: ' + error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdateTemplate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (isEditing) {
        await emailTemplateApi.updateEmailTemplate(templateForm.id, templateForm);
        setNotification({
          show: true,
          message: 'Email template updated successfully',
          type: 'success'
        });
      } else {
        await emailTemplateApi.createEmailTemplate(templateForm);
        setNotification({
          show: true,
          message: 'Email template created successfully',
          type: 'success'
        });
      }
      resetTemplateForm();
      loadEmailTemplates();
    } catch (error) {
      setNotification({
        show: true,
        message: `Error ${isEditing ? 'updating' : 'creating'} template: ${error.message}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditTemplate = (template) => {
    setTemplateForm({
      id: template.id,
      name: template.name,
      description: template.description,
      subject: template.subject,
      content: template.content,
      template_type: template.template_type,
      is_active: template.is_active
    });
    setIsEditing(true);
    // Scroll to form
    document.querySelector('#templateForm')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePreviewTemplate = async (template) => {
    try {
      const preview = await emailTemplateApi.previewTemplateEmail({
        template_id: template.id,
        variables: {} // You could add example variables here
      });
      
      // Show preview in modal
      setPreviewModal({
        show: true,
        data: {
          templateName: template.name,
          subject: preview.subject,
          content: preview.content,
          variablesUsed: preview.variables_used || []
        }
      });
      
    } catch (error) {
      setNotification({
        show: true,
        message: 'Error generating preview: ' + error.message,
        type: 'error'
      });
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this email template?')) return;
    try {
      setLoading(true);
      await emailTemplateApi.deleteEmailTemplate(templateId);
      setNotification({
        show: true,
        message: 'Email template deleted successfully',
        type: 'success'
      });
      loadEmailTemplates();
    } catch (error) {
      setNotification({
        show: true,
        message: 'Error deleting email template: ' + error.message,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <section className={styles.section}>
            <h1 className={styles.mainTitle}>General Parameters</h1>
          <div className={styles.parameterGroup}>
              <div className={styles.parameterItem}>
                <label>Default currency:</label>
                <input 
                  type="text" 
                  className={styles.input}
                  value={params.general.defaultCurrency}
                  onChange={(e) => handleChange('general', 'defaultCurrency', e.target.value)}
                />
              </div>
              <div className={styles.parameterItem}>
                <label>Date format:</label>
                <input 
                  type="text" 
                  className={styles.input}
                  value={params.general.dateFormat}
                  onChange={(e) => handleChange('general', 'dateFormat', e.target.value)}
                />
              </div>
              <div className={styles.parameterItem}>
                <label>Time zone:</label>
                <input 
                  type="text" 
                  className={styles.input}
                  value={params.general.timeZone}
                  onChange={(e) => handleChange('general', 'timeZone', e.target.value)}
                />
              </div>
            </div>

            <div className={styles.parameterGroup}>
              <h2 className={styles.sectionTitle}>DSCR</h2>
            <div className={styles.parameterItem}>
              <label>Minimum amount:</label>
              <input 
                type="number" 
                className={styles.input}
                value={params.dscr.minAmount}
                onChange={(e) => handleChange('dscr', 'minAmount', e.target.value)}
              />
            </div>
            <div className={styles.parameterItem}>
              <label>Maximum amount:</label>
              <input 
                type="number" 
                className={styles.input}
                value={params.dscr.maxAmount}
                onChange={(e) => handleChange('dscr', 'maxAmount', e.target.value)}
              />
            </div>
            <div className={styles.parameterItem}>
              <label>Minimum DSCR ratio:</label>
              <input 
                type="number" 
                step="0.01" 
                className={styles.input}
                value={params.dscr.minRatio}
                onChange={(e) => handleChange('dscr', 'minRatio', e.target.value)}
              />
          </div>
        </div>

            <div className={styles.parameterGroup}>
          <h2 className={styles.sectionTitle}>Fixflip</h2>
            <div className={styles.parameterItem}>
              <label>Minimum amount:</label>
              <input 
                type="number" 
                className={styles.input}
                value={params.fixflip.minAmount}
                onChange={(e) => handleChange('fixflip', 'minAmount', e.target.value)}
              />
            </div>
            <div className={styles.parameterItem}>
              <label>Maximum amount:</label>
              <input 
                type="number" 
                className={styles.input}
                value={params.fixflip.maxAmount}
                onChange={(e) => handleChange('fixflip', 'maxAmount', e.target.value)}
              />
            </div>
            <div className={styles.parameterItem}>
              <label>Maximum LTV (%):</label>
              <input 
                type="number" 
                className={styles.input}
                value={params.fixflip.maxLTV}
                onChange={(e) => handleChange('fixflip', 'maxLTV', e.target.value)}
              />
          </div>
        </div>

            <div className={styles.parameterGroup}>
          <h2 className={styles.sectionTitle}>Construction</h2>
            <div className={styles.parameterItem}>
              <label>Minimum amount:</label>
              <input 
                type="number" 
                className={styles.input}
                value={params.construction.minAmount}
                onChange={(e) => handleChange('construction', 'minAmount', e.target.value)}
              />
            </div>
            <div className={styles.parameterItem}>
              <label>Maximum amount:</label>
              <input 
                type="number" 
                className={styles.input}
                value={params.construction.maxAmount}
                onChange={(e) => handleChange('construction', 'maxAmount', e.target.value)}
              />
            </div>
            <div className={styles.parameterItem}>
              <label>Maximum term (months):</label>
              <input 
                type="number" 
                className={styles.input}
                value={params.construction.maxTerm}
                onChange={(e) => handleChange('construction', 'maxTerm', e.target.value)}
              />
          </div>
        </div>

            <div className={styles.parameterGroup}>
          <h2 className={styles.sectionTitle}>Documents</h2>
            <div className={styles.parameterItem}>
              <label>Maximum size (MB):</label>
                <input 
                  type="number" 
                  className={styles.input}
                  value={params.documents.maxSize}
                  onChange={(e) => handleChange('documents', 'maxSize', e.target.value)}
                />
            </div>
            <div className={styles.parameterItem}>
              <label>Allowed formats:</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  placeholder="E.g: .pdf, .jpg, .png"
                  value={params.documents.allowedFormats}
                  onChange={(e) => handleChange('documents', 'allowedFormats', e.target.value)}
                />
            </div>
            <div className={styles.parameterItem}>
              <label>Required documents:</label>
                <textarea 
                  className={styles.textarea} 
                  placeholder="Comma-separated list"
                  value={params.documents.requiredDocs}
                  onChange={(e) => handleChange('documents', 'requiredDocs', e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.saveButton} onClick={handleSave}>Save Changes</button>
              <button className={styles.cancelButton} onClick={handleCancel}>Cancel</button>
            </div>
          </section>
        );

      case 'companies':
        return (
          <section className={styles.section}>
            <h1 className={styles.mainTitle}>Companies</h1>
            
            {/* Form to create new company */}
            <form onSubmit={handleCreateCompany} className={styles.companyForm}>
              <h3>Create New Company</h3>
              <div className={styles.formGroup}>
                <label>Name:</label>
                <input
                  type="text"
                  className={styles.input}
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Description:</label>
                <textarea
                  className={styles.textarea}
                  value={newCompany.description}
                  onChange={(e) => setNewCompany({...newCompany, description: e.target.value})}
                  required
                ></textarea>
              </div>
              <button type="submit" className={styles.saveButton} disabled={loading}>
                {loading ? 'Creating...' : 'Create Company'}
              </button>
            </form>

            {/* Companies list */}
            <div className={styles.companiesList}>
              <h3>Existing Companies</h3>
              {loading ? (
                <p>Loading companies...</p>
              ) : (
                <table className={styles.companyTable}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(companies) && companies.map(company => (
                      <tr key={company.id}>
                        <td>
                          {editingCompany?.id === company.id ? (
                            <input
                              type="text"
                              className={styles.input}
                              value={editingCompany.name}
                              onChange={(e) => setEditingCompany({...editingCompany, name: e.target.value})}
                            />
                          ) : (
                            company.name
                          )}
                        </td>
                        <td>
                          {editingCompany?.id === company.id ? (
                            <textarea
                              className={styles.textarea}
                              value={editingCompany.description}
                              onChange={(e) => setEditingCompany({...editingCompany, description: e.target.value})}
                            ></textarea>
                          ) : (
                            company.description
                          )}
                        </td>
                        <td>{company.status ? 'Active' : 'Inactive'}</td>
                        <td>
                          {editingCompany?.id === company.id ? (
                            <>
                              <button
                                className={styles.saveButton}
                                onClick={() => handleUpdateCompany(company.id)}
                                disabled={loading}
                              >
                                Save
                              </button>
                              <button
                                className={styles.cancelButton}
                                onClick={() => setEditingCompany(null)}
                                disabled={loading}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className={styles.editButton}
                                onClick={() => setEditingCompany(company)}
                                disabled={loading}
                              >
                                Edit
                              </button>
                              <button
                                className={styles.deleteButton}
                                onClick={() => handleDeleteCompany(company.id)}
                                disabled={loading}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        );

      case 'documents':
        return (
          <section className={styles.section}>
            <h1 className={styles.mainTitle}>Document Types</h1>
            
            {/* Form to create new document type */}
            <form onSubmit={handleCreateDocumentType} className={styles.companyForm}>
              <h3>Create New Document Type</h3>
              <div className={styles.formGroup}>
                <label>Name:</label>
                <input
                  type="text"
                  className={styles.input}
                  value={newDocumentType.name}
                  onChange={(e) => setNewDocumentType({...newDocumentType, name: e.target.value})}
                  required
                />
              </div>
              <button type="submit" className={styles.saveButton} disabled={loading}>
                {loading ? 'Creating...' : 'Create Document Type'}
              </button>
            </form>

            {/* Document types list */}
            <div className={styles.companiesList}>
              <h3>Existing Document Types</h3>
              {loading ? (
                <p>Loading document types...</p>
              ) : (
                <table className={styles.companyTable}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Creation Date</th>
                      <th>Update Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(documentTypes) && documentTypes.map(type => (
                      <tr key={type.id}>
                        <td>{type.id}</td>
                        <td>
                          {editingDocumentType?.id === type.id ? (
                            <input
                              type="text"
                              className={styles.input}
                              value={editingDocumentType.name}
                              onChange={(e) => setEditingDocumentType({...editingDocumentType, name: e.target.value})}
                            />
                          ) : (
                            type.name
                          )}
                        </td>
                        <td>{type.created_at ? new Date(type.created_at).toLocaleDateString() : 'N/A'}</td>
                        <td>{type.updated_at ? new Date(type.updated_at).toLocaleDateString() : 'N/A'}</td>
                        <td>
                          {editingDocumentType?.id === type.id ? (
                            <>
                              <button
                                className={styles.saveButton}
                                onClick={() => handleUpdateDocumentType(type.id)}
                                disabled={loading}
                              >
                                Save
                              </button>
                              <button
                                className={styles.cancelButton}
                                onClick={() => setEditingDocumentType(null)}
                                disabled={loading}
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className={styles.editButton}
                                onClick={() => setEditingDocumentType(type)}
                                disabled={loading}
                              >
                                Edit
                              </button>
                              <button
                                className={styles.deleteButton}
                                onClick={() => handleDeleteDocumentType(type.id)}
                                disabled={loading}
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        );

      case 'templates':
        return (
          <section className={styles.section}>
            <h1 className={styles.mainTitle}>Email Templates</h1>
            
            {/* Form to create/edit template */}
            <form id="templateForm" onSubmit={handleCreateOrUpdateTemplate} className={styles.companyForm}>
              <h3>{isEditing ? 'Edit Email Template' : 'Create New Email Template'}</h3>
              <div className={styles.formGroup}>
                <label>Name:</label>
                <input
                  type="text"
                  className={styles.input}
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Template Type:</label>
                <select
                  className={styles.input}
                  value={templateForm.template_type}
                  onChange={(e) => setTemplateForm({...templateForm, template_type: e.target.value})}
                  required
                >
                  <option value="">Select a type</option>
                  {Array.isArray(templateTypes) && templateTypes.map((type, index) => (
                    <option key={index} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Subject:</label>
                <input
                  type="text"
                  className={styles.input}
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({...templateForm, subject: e.target.value})}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Content:</label>
                <textarea
                  className={styles.textarea}
                  value={templateForm.content}
                  onChange={(e) => setTemplateForm({...templateForm, content: e.target.value})}
                  required
                  rows={10}
                ></textarea>
              </div>
              <div className={styles.formGroup}>
                <label>Description:</label>
                <textarea
                  className={styles.textarea}
                  value={templateForm.description}
                  onChange={(e) => setTemplateForm({...templateForm, description: e.target.value})}
                  required
                ></textarea>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={templateForm.is_active}
                    onChange={(e) => setTemplateForm({...templateForm, is_active: e.target.checked})}
                  />
                  Active template
                </label>
              </div>
              <div className={styles.buttonGroup}>
                <button type="submit" className={styles.saveButton} disabled={loading}>
                  {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Template' : 'Create Template')}
                </button>
                {isEditing && (
                  <button 
                    type="button" 
                    className={styles.cancelButton} 
                    onClick={resetTemplateForm}
                    disabled={loading}
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>

            {/* Templates list */}
            <div className={styles.companiesList}>
              <h3>Existing Templates</h3>
              {loading ? (
                <p>Loading templates...</p>
              ) : (
                <table className={styles.companyTable}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Subject</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(emailTemplates) && emailTemplates.map(template => (
                      <tr key={template.id}>
                        <td>{template.name}</td>
                        <td>{template.template_type}</td>
                        <td>{template.subject}</td>
                        <td>{template.description}</td>
                        <td>{template.is_active ? 'Active' : 'Inactive'}</td>
                        <td>
                          <button
                            className={styles.editButton}
                            onClick={() => handleEditTemplate(template)}
                            disabled={loading}
                            title="Edit"
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button
                            className={styles.previewButton}
                            onClick={() => handlePreviewTemplate(template)}
                            disabled={loading}
                            title="Preview"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button
                            className={styles.deleteButton}
                            onClick={() => handleDeleteTemplate(template.id)}
                            disabled={loading}
                            title="Delete"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
          </section>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`${styles.container} internal_layout`}>
      {/* Header with tabs */}
      <div className={styles.tabsHeader}>
        <h1 className={styles.pageTitle}>System Parameters</h1>
        
        {/* Navigation tabs */}
        <div className={styles.tabsContainer}>
          <button
            className={`${styles.tabButton} ${activeTab === 'general' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <i className="bi bi-gear-fill me-2"></i>
            General Parameters
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'companies' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('companies')}
          >
            <i className="bi bi-building me-2"></i>
            Companies
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'documents' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('documents')}
          >
            <i className="bi bi-file-earmark-text me-2"></i>
            Document Types
          </button>
          <button
            className={`${styles.tabButton} ${activeTab === 'templates' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('templates')}
          >
            <i className="bi bi-envelope me-2"></i>
            Email Templates
          </button>
        </div>
      </div>

      {/* Active tab content */}
      <div className={styles.tabContent}>
        {renderTabContent()}
      </div>

      {notification.show && (
        <Notification 
          message={notification.message} 
          type={notification.type} 
          onClose={() => setNotification(prev => ({...prev, show: false}))}
        />
      )}

      {/* Template Preview Modal */}
      {previewModal.show && previewModal.data && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  📧 Preview: {previewModal.data.templateName}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setPreviewModal({ show: false, data: null })}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <h6>📝 Subject:</h6>
                  <div className="p-2 bg-light border rounded">
                    {previewModal.data.subject}
                  </div>
                </div>
                
                <div className="mb-3">
                  <h6>📄 Content:</h6>
                  <div 
                    className="p-3 bg-light border rounded" 
                    style={{ maxHeight: '300px', overflowY: 'auto' }}
                    dangerouslySetInnerHTML={{ __html: previewModal.data.content }}
                  ></div>
                </div>
                
                {previewModal.data.variablesUsed.length > 0 && (
                  <div className="mb-3">
                    <h6>🔧 Variables Used:</h6>
                    <div className="p-2 bg-light border rounded">
                      {previewModal.data.variablesUsed.map((variable, index) => (
                        <span key={index} className="badge bg-primary me-1">
                          {`{${variable}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="alert alert-info">
                  <i className="bi bi-info-circle me-2"></i>
                  <strong>Note:</strong> Variables like {`{full_name}`}, {`{email}`}, etc. will be replaced with actual data when the email is sent.
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setPreviewModal({ show: false, data: null })}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Parameters;
