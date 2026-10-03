import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialCategories, initialDepartments, initialDocuments, initialAuditLogs } from '../data/mockData';
import { translations } from '../data/translations';
import { archiveApi } from '../services/api';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [lang, setLang] = useState('ar');
  const [darkMode, setDarkMode] = useState(true);
  const [currentRole, setCurrentRole] = useState('itStaff'); // 'superAdmin', 'itStaff', 'viewer'
  
  const [activeTab, setActiveTab] = useState('documents');
  const [documents, setDocuments] = useState(initialDocuments);
  const [categories, setCategories] = useState(initialCategories);
  const [departments] = useState(initialDepartments);
  const [auditLogs, setAuditLogs] = useState(initialAuditLogs);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [previewAttachment, setPreviewAttachment] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Load live data from Laravel MySQL API
  const refreshAllData = async () => {
    try {
      const health = await archiveApi.checkHealth();
      if (health && health.status === 'online') {
        setIsBackendConnected(true);

        const [apiDocs, apiCats, apiLogs] = await Promise.all([
          archiveApi.getDocuments(),
          archiveApi.getCategories(),
          archiveApi.getAuditLogs()
        ]);

        if (apiDocs && apiDocs.length > 0) {
          const normalizedDocs = apiDocs.map(doc => ({
            ...doc,
            tags: Array.isArray(doc.tags)
              ? doc.tags.map(t => (typeof t === 'object' && t !== null ? (t.name || t.slug || '') : String(t))).filter(Boolean)
              : []
          }));
          setDocuments(normalizedDocs);
        }
        if (apiCats && apiCats.length > 0) {
          setCategories(apiCats);
        }
        if (apiLogs && apiLogs.length > 0) {
          setAuditLogs(apiLogs);
        }
      } else {
        setIsBackendConnected(false);
      }
    } catch (e) {
      console.warn('Backend sync warning:', e);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const toggleLanguage = () => {
    setLang(prev => (prev === 'ar' ? 'en' : 'ar'));
  };

  const toggleTheme = () => {
    setDarkMode(prev => !prev);
  };

  const t = (key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  };

  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const addAuditLog = (action, entity, details) => {
    const userName = currentRole === 'superAdmin' ? 'مدير الأرشيف' : 'أخصائي أرشفة IT';
    const newLog = {
      id: Date.now(),
      action,
      user: userName,
      role: currentRole,
      ip: '192.168.10.25',
      entity,
      date: new Date().toISOString().replace('T', ' ').substring(0, 19),
      details
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  const generateArchiveNumber = (categoryCode = 'ARC') => {
    const year = new Date().getFullYear();
    const count = documents.length + 1;
    const seq = String(count).padStart(5, '0');
    return `${categoryCode}-${year}-${seq}`;
  };

  const archiveNewDocument = async (docData) => {
    const cat = categories.find(c => c.id === Number(docData.category_id));
    const prefix = cat ? cat.code : 'ARC';
    const newArchiveNumber = generateArchiveNumber(prefix);

    // Call Laravel Backend API if online
    if (isBackendConnected) {
      try {
        const formData = new FormData();
        formData.append('title', docData.title);
        formData.append('category_id', docData.category_id);
        if (docData.original_number) formData.append('original_number', docData.original_number);
        if (docData.department_id) formData.append('department_id', docData.department_id);
        if (docData.organization) formData.append('organization', docData.organization);
        if (docData.document_date) formData.append('document_date', docData.document_date);
        if (docData.confidentiality) formData.append('confidentiality', docData.confidentiality);
        if (docData.physical_location) formData.append('physical_location', docData.physical_location);
        if (docData.description) formData.append('description', docData.description);
        if (docData.notes) formData.append('notes', docData.notes);
        if (docData.tags) formData.append('tags', docData.tags);

        if (docData.file instanceof File) {
          formData.append('file', docData.file);
        }

        const apiResult = await archiveApi.createDocument(formData);
        if (apiResult && apiResult.success) {
          await refreshAllData();
          showToast(`${t('successMsg')}: ${apiResult.data.document_number}`, 'success');
          return apiResult.data;
        }
      } catch (err) {
        console.error('API create document error:', err);
      }
    }

    // Local state fallback if offline or backend error
    const newDoc = {
      id: Date.now(),
      document_number: newArchiveNumber,
      original_number: docData.original_number || '',
      title: docData.title,
      category_id: Number(docData.category_id || 1),
      department_id: Number(docData.department_id || 1),
      organization: docData.organization || 'إدارة تقنية المعلومات والأنظمة',
      archived_by: currentRole === 'superAdmin' ? 'مدير الأرشيف' : 'أخصائي أرشفة IT',
      document_date: docData.document_date || new Date().toISOString().substring(0, 10),
      archived_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
      confidentiality: docData.confidentiality || 'internal',
      physical_location: docData.physical_location || 'مستودع الأرشيف - دولاب رقم 2',
      description: docData.description,
      notes: docData.notes || '',
      tags: docData.tags ? (typeof docData.tags === 'string' ? docData.tags.split(',').map(s => s.trim()) : docData.tags) : ['أرشيف_إلكتروني'],
      attachments: docData.attachments || [
        {
          id: Date.now() + 1,
          original_name: docData.uploadedFileName || 'Archived_Document.pdf',
          file_size: docData.uploadedFileSize || '2.3 MB',
          mime_type: 'application/pdf',
          uploaded_by: 'أخصائي الأرشفة',
          checksum: '8f3b' + Math.random().toString(16).substring(2) + 'a1ef',
          created_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
          preview_type: 'pdf'
        }
      ],
      versions: [
        {
          version_number: 'v1.0',
          file_name: docData.uploadedFileName || 'Archived_Document.pdf',
          uploaded_by: 'أخصائي الأرشفة',
          change_summary: 'الإيداع الأولي للمستند في الأرشيف المركزي.',
          created_at: new Date().toISOString().replace('T', ' ').substring(0, 16)
        }
      ],
      audit_logs: [
        {
          id: Date.now() + 2,
          action: 'create',
          user: 'أخصائي الأرشفة',
          ip: '192.168.10.25',
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          details: `أرشفة الوثيقة برقم أرشيفي ${newArchiveNumber}`
        }
      ]
    };

    setDocuments(prev => [newDoc, ...prev]);
    addAuditLog('create', `وثيقة أرشيفية: ${newArchiveNumber}`, `أرشفة وحفظ وثيقة: ${docData.title}`);
    showToast(`${t('successMsg')}: ${newArchiveNumber}`, 'success');
    return newDoc;
  };

  const deleteDocument = async (documentId) => {
    const doc = documents.find(d => d.id === documentId);
    if (isBackendConnected) {
      archiveApi.deleteDocument(documentId);
    }
    setDocuments(prev => prev.filter(d => d.id !== documentId));
    if (selectedDocument?.id === documentId) setSelectedDocument(null);
    addAuditLog('delete', `وثيقة: ${doc?.document_number}`, `حذف الوثيقة من الأرشيف الإلكتروني`);
    showToast('تم حذف الوثيقة من الأرشيف', 'info');
  };

  const addAttachmentToDocument = (documentId, fileData) => {
    const newAttach = {
      id: Date.now(),
      original_name: fileData.name || 'document_scan.pdf',
      file_size: fileData.size || '1.8 MB',
      mime_type: fileData.type || 'application/pdf',
      uploaded_by: 'أخصائي الأرشفة',
      checksum: 'e' + Math.random().toString(16).substring(2) + Math.random().toString(16).substring(2),
      created_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
      preview_type: fileData.name?.endsWith('.png') || fileData.name?.endsWith('.jpg') ? 'image' : 'pdf'
    };

    setDocuments(prev => prev.map(doc => {
      if (doc.id !== documentId) return doc;
      const updated = {
        ...doc,
        attachments: [...doc.attachments, newAttach],
        audit_logs: [
          {
            id: Date.now(),
            action: 'upload',
            user: newAttach.uploaded_by,
            ip: '192.168.10.25',
            date: newAttach.created_at,
            details: `إضافة مرفق جديد للأرشيف: ${newAttach.original_name}`
          },
          ...doc.audit_logs
        ]
      };
      if (selectedDocument?.id === documentId) {
        setSelectedDocument(updated);
      }
      return updated;
    }));

    addAuditLog('upload', `وثيقة: ${selectedDocument?.document_number}`, `إضافة ملف للمستودع: ${newAttach.original_name}`);
    showToast('تمت إضافة الملف وحفظه في الأرشيف', 'success');
  };

  const addCategory = async (categoryData) => {
    if (isBackendConnected) {
      archiveApi.addCategory(categoryData);
    }

    const newCat = {
      id: Date.now(),
      code: categoryData.code.toUpperCase(),
      name_ar: categoryData.name_ar,
      name_en: categoryData.name_en,
      icon: categoryData.icon || 'Archive',
      color: categoryData.color || 'blue',
      count: 0
    };
    setCategories(prev => [...prev, newCat]);
    addAuditLog('create', `تصنيف أرشيفي: ${newCat.name_ar}`, 'إضافة تصنيف أرشيفي جديد');
    showToast('تمت إضافة التصنيف بنجاح', 'success');
  };

  return (
    <AppContext.Provider
      value={{
        lang,
        dir: lang === 'ar' ? 'rtl' : 'ltr',
        toggleLanguage,
        darkMode,
        toggleTheme,
        currentRole,
        setCurrentRole,
        activeTab,
        setActiveTab,
        documents,
        categories,
        departments,
        auditLogs,
        isBackendConnected,
        selectedDocument,
        setSelectedDocument,
        previewAttachment,
        setPreviewAttachment,
        isCreateModalOpen,
        setIsCreateModalOpen,
        globalSearch,
        setGlobalSearch,
        toasts,
        t,
        showToast,
        archiveNewDocument,
        deleteDocument,
        addAttachmentToDocument,
        addCategory,
        addAuditLog,
        refreshAllData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
