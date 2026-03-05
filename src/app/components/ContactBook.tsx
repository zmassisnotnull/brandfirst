import { useState, useEffect } from 'react';
import { Plus, Building2, User, Mail, Phone, Globe, MapPin, Edit2, Trash2, Search, ArrowLeft, CreditCard, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Footer } from './Footer';
import { Contact, Company, ContactWithCompany } from '../types/contact';
import { projectId, publicAnonKey } from '../../../utils/supabase/info';

interface ContactBookProps {
  onNavigate: (page: string) => void;
  onContactSelect?: (contact: ContactWithCompany) => void;
  selectMode?: boolean; // 연락처 선택 모드 (명함 제작용)
  previousPage?: string; // 이전 페이지
}

export function ContactBook({ onNavigate, onContactSelect, selectMode = false, previousPage = 'home' }: ContactBookProps) {
  const [contacts, setContacts] = useState<ContactWithCompany[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [selectedGroupForContact, setSelectedGroupForContact] = useState<string | null>(null);
  const [editingContact, setEditingContact] = useState<ContactWithCompany | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load companies
      const companiesRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747/contacts/companies`,
        {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );
      const companiesData = await companiesRes.json();
      setCompanies(Array.isArray(companiesData) ? companiesData : []);

      // Load contacts
      const contactsRes = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747/contacts`,
        {
          headers: { Authorization: `Bearer ${publicAnonKey}` },
        }
      );
      const contactsData = await contactsRes.json();
      setContacts(Array.isArray(contactsData) ? contactsData : []);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCard = (contact: ContactWithCompany) => {
    if (onContactSelect) {
      onContactSelect(contact);
    }
    // 페이지 이동은 App.tsx에서 처리하므로 여기서는 호출하지 않음
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.position.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCompany = selectedCompanyId === 'all' || contact.companyId === selectedCompanyId;
    
    return matchesSearch && matchesCompany;
  });

  const groupedContacts = filteredContacts.reduce((acc, contact) => {
    const companyName = contact.company.name;
    if (!acc[companyName]) {
      acc[companyName] = {
        company: contact.company,
        contacts: [],
      };
    }
    acc[companyName].contacts.push(contact);
    return acc;
  }, {} as Record<string, { company: Company; contacts: Contact[] }>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex flex-col">
      {/* Title, Search and Filter */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-6 py-6">
          {/* Title and Subtitle */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold">
              {selectMode ? '연락처 선택' : '주소록'}
            </h1>
            <p className="text-gray-600 mt-2">
              {selectMode ? '명함을 만들 연락처를 선택하세요' : '연락처와 회사 정보를 관리하세요'}
            </p>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="이름, 회사, 직함으로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCompanyId}
              onChange={(e) => setSelectedCompanyId(e.target.value)}
              className="px-4 py-2 border rounded-lg bg-white"
            >
              <option value="all">전체 회사</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name} ({company.employeeCount}명)
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          {!selectMode && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowAddCompany(true)}>
                <Building2 className="w-4 h-4 mr-2" />
                그룹 생성
              </Button>
              <Button onClick={() => setShowAddContact(true)}>
                <Plus className="w-4 h-4 mr-2" />
                연락처 추가
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">주소록 불러오는 중...</p>
            </div>
          </div>
        ) : Object.keys(groupedContacts).length === 0 ? (
          <div className="text-center py-20">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchQuery ? '검색 결과가 없습니다' : '등록된 연락처가 없습니다'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? '다른 검색어를 시도해보세요' : '첫 번째 연락처를 추가해보세요'}
            </p>
            {!selectMode && !searchQuery && (
              <Button onClick={() => setShowAddContact(true)}>
                <Plus className="w-4 h-4 mr-2" />
                연락처 추가하기
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedContacts).map(([companyName, group]) => (
              <div key={companyName}>
                {/* Company Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                    {companyName.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-bold">{companyName}</h2>
                    <p className="text-sm text-gray-500">
                      {group.contacts.length}명의 연락처
                      {group.company.address && ` • ${group.company.address}`}
                    </p>
                  </div>
                  {!selectMode && (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedGroupForContact(group.company.id);
                          setShowAddContact(true);
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        연락처 추가
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setEditingCompany(group.company)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Contact Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.contacts.map((contact) => (
                    <Card
                      key={contact.id}
                      className="p-5 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-lg">{contact.name}</h3>
                            <p className="text-sm text-gray-600">{contact.position}</p>
                            {contact.department && (
                              <p className="text-xs text-gray-500">{contact.department}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingContact({ ...contact, company: group.company });
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600"
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (confirm(`${contact.name}님의 연락처를 삭제하시겠습니까?`)) {
                                try {
                                  const response = await fetch(
                                    `https://${projectId}.supabase.co/functions/v1/make-server-98397747/contacts/${contact.id}`,
                                    {
                                      method: 'DELETE',
                                      headers: { Authorization: `Bearer ${publicAnonKey}` },
                                    }
                                  );
                                  if (response.ok) {
                                    loadData();
                                  } else {
                                    alert('연락처 삭제에 실패했습니다.');
                                  }
                                } catch (error) {
                                  console.error('Failed to delete contact:', error);
                                  alert('연락처 삭제에 실패했습니다.');
                                }
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        {contact.mobile && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="w-4 h-4" />
                            <span>{contact.mobile}</span>
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-4 h-4" />
                            <span className="truncate">{contact.email}</span>
                          </div>
                        )}
                        {contact.website && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Globe className="w-4 h-4" />
                            <span className="truncate">{contact.website}</span>
                          </div>
                        )}
                      </div>

                      {selectMode && (
                        <Button
                          className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600"
                          onClick={() => handleCreateCard({ ...contact, company: group.company })}
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          명함 만들기
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />

      {/* Add Company Modal */}
      {showAddCompany && (
        <AddCompanyModal
          onClose={() => setShowAddCompany(false)}
          onSuccess={() => {
            setShowAddCompany(false);
            loadData();
          }}
        />
      )}

      {/* Add Contact Modal */}
      {showAddContact && (
        <AddContactModal
          companies={companies}
          preselectedCompanyId={selectedGroupForContact}
          onClose={() => {
            setShowAddContact(false);
            setSelectedGroupForContact(null);
          }}
          onSuccess={() => {
            setShowAddContact(false);
            setSelectedGroupForContact(null);
            loadData();
          }}
        />
      )}

      {/* Edit Contact Modal */}
      {editingContact && (
        <EditContactModal
          contact={editingContact}
          companies={companies}
          onClose={() => setEditingContact(null)}
          onSuccess={() => {
            setEditingContact(null);
            loadData();
          }}
        />
      )}

      {/* Edit Company Modal */}
      {editingCompany && (
        <EditCompanyModal
          company={editingCompany}
          onClose={() => setEditingCompany(null)}
          onSuccess={() => {
            setEditingCompany(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// Add Company Modal Component
function AddCompanyModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (company?: Company) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    fax: '',
    website: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747/contacts/companies`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error('그룹 생성 실패');
      }

      const newCompany = await response.json();
      onSuccess(newCompany);
    } catch (error) {
      console.error('Failed to create company:', error);
      alert('그룹 생성에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">그룹 생성</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">그룹명 *</label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="예: ABC 회사"
              autoFocus
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              취소
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">
              {submitting ? '생성 중...' : '생성'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Contact Modal Component
function AddContactModal({ 
  companies, 
  preselectedCompanyId,
  onClose, 
  onSuccess 
}: { 
  companies: Company[];
  preselectedCompanyId: string | null;
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: '',
    position: '',
    department: '',
    companyId: preselectedCompanyId || '',
    mobile: '',
    phone: '',
    fax: '',
    email: '',
    website: '',
    address: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [localCompanies, setLocalCompanies] = useState(companies);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747/contacts`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error('연락처 추가 실패');
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to create contact:', error);
      alert('연락처 추가에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCompany = () => {
    setShowAddCompany(true);
  };

  const handleCompanySuccess = (newCompany: Company) => {
    setShowAddCompany(false);
    setLocalCompanies([...localCompanies, newCompany]);
    setFormData({ ...formData, companyId: newCompany.id });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">연락처 추가</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">그룹 *</label>
            <select
              required
              value={formData.companyId}
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'create_new') {
                  setShowAddCompany(true);
                  // Reset to empty so it stays required
                  setFormData({ ...formData, companyId: '' });
                } else {
                  setFormData({ ...formData, companyId: value });
                }
              }}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">그룹 선택</option>
              {localCompanies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
              <option value="create_new" className="font-semibold text-blue-600">
                + 새 그룹 만들기
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">이름 *</label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="예: 홍길동"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">직함 *</label>
            <Input
              required
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="예: 대표이사"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">휴대폰 *</label>
            <Input
              required
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              placeholder="예: 010-1234-5678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">이메일 *</label>
            <Input
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="예: example@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">부서</label>
            <Input
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="예: 영업팀"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">전화번호</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="예: 02-1234-5678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">웹사이트</label>
            <Input
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="예: https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">주소</label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="예: 서울시 강남구"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              취소
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">
              {submitting ? '추가 중...' : '추가'}
            </Button>
          </div>
        </form>
      </div>

      {/* Add Company Modal */}
      {showAddCompany && (
        <AddCompanyModal
          onClose={() => setShowAddCompany(false)}
          onSuccess={handleCompanySuccess}
        />
      )}
    </div>
  );
}

// Edit Contact Modal Component
function EditContactModal({ 
  contact, 
  companies, 
  onClose, 
  onSuccess 
}: { 
  contact: ContactWithCompany;
  companies: Company[];
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: contact.name,
    position: contact.position,
    department: contact.department || '',
    companyId: contact.companyId,
    mobile: contact.mobile,
    phone: contact.phone || '',
    fax: contact.fax || '',
    email: contact.email,
    website: contact.website || '',
    address: contact.address || '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState(false);
  const [localCompanies, setLocalCompanies] = useState(companies);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747/contacts/${contact.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error('연락처 수정 실패');
      }

      onSuccess();
    } catch (error) {
      console.error('Failed to update contact:', error);
      alert('연락처 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddCompany = () => {
    setShowAddCompany(true);
  };

  const handleCompanySuccess = (newCompany: Company) => {
    setShowAddCompany(false);
    setLocalCompanies([...localCompanies, newCompany]);
    setFormData({ ...formData, companyId: newCompany.id });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">연락처 수정</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">그룹 *</label>
            <select
              required
              value={formData.companyId}
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'create_new') {
                  setShowAddCompany(true);
                  // Reset to empty so it stays required
                  setFormData({ ...formData, companyId: '' });
                } else {
                  setFormData({ ...formData, companyId: value });
                }
              }}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">그룹 선택</option>
              {localCompanies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
              <option value="create_new" className="font-semibold text-blue-600">
                + 새 그룹 만들기
              </option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">이름 *</label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="예: 홍길동"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">직함 *</label>
            <Input
              required
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              placeholder="예: 대표이사"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">휴대폰 *</label>
            <Input
              required
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              placeholder="예: 010-1234-5678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">이메일 *</label>
            <Input
              required
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="예: example@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">부서</label>
            <Input
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              placeholder="예: 영업팀"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">전화번호</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="예: 02-1234-5678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">웹사이트</label>
            <Input
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="예: https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">주소</label>
            <Input
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="예: 서울시 강남구"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              취소
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">
              {submitting ? '수정 중...' : '수정'}
            </Button>
          </div>
        </form>
      </div>

      {/* Add Company Modal */}
      {showAddCompany && (
        <AddCompanyModal
          onClose={() => setShowAddCompany(false)}
          onSuccess={handleCompanySuccess}
        />
      )}
    </div>
  );
}

// Edit Company Modal Component
function EditCompanyModal({ 
  company, 
  onClose, 
  onSuccess 
}: { 
  company: Company;
  onClose: () => void; 
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    name: company.name,
    address: company.address || '',
    phone: company.phone || '',
    fax: company.fax || '',
    website: company.website || '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-98397747/contacts/companies/${company.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        throw new Error('그룹 수정 실패');
      }

      const updatedCompany = await response.json();
      onSuccess(updatedCompany);
    } catch (error) {
      console.error('Failed to update company:', error);
      alert('그룹 수정에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">그룹 수정</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">그룹명 *</label>
            <Input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="예: ABC 회사"
              autoFocus
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              취소
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600">
              {submitting ? '수정 중...' : '수정'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}