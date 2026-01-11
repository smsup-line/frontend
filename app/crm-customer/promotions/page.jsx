'use client';

import { useState, useEffect } from 'react';
import { Content } from '@/components/layouts/crm/components/content';
import PromotionsList from './promotions-list';
import { PageHeader } from './page-header';
import CustomerPromotionsPage from './customer-promotions-page';

export default function PromotionsPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check user role from localStorage
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserRole(user.role || user.user_type || 'customer');
        } catch (e) {
          console.error('Failed to parse user info:', e);
          setUserRole('customer');
        }
      } else {
        setUserRole('customer');
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  // If user is customer, show customer promotions page
  // If user is employee/admin, show admin promotions list
  const isEmployee = userRole === 'employee' || userRole === 'adminshop' || userRole === 'admin';

  if (isEmployee) {
    return (
      <>
        <PageHeader onRefresh={() => setRefreshKey(prev => prev + 1)} />
        <Content className="block py-0">
          <PromotionsList key={refreshKey} />
        </Content>
      </>
    );
  }

  // Customer view
  return <CustomerPromotionsPage />;
}

          setUserRole(user.role || user.user_type || 'customer');
        } catch (e) {
          console.error('Failed to parse user info:', e);
          setUserRole('customer');
        }
      } else {
        setUserRole('customer');
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  // If user is customer, show customer promotions page
  // If user is employee/admin, show admin promotions list
  const isEmployee = userRole === 'employee' || userRole === 'adminshop' || userRole === 'admin';

  if (isEmployee) {
    return (
      <>
        <PageHeader onRefresh={() => setRefreshKey(prev => prev + 1)} />
        <Content className="block py-0">
          <PromotionsList key={refreshKey} />
        </Content>
      </>
    );
  }

  // Customer view
  return <CustomerPromotionsPage />;
}

          setUserRole(user.role || user.user_type || 'customer');
        } catch (e) {
          console.error('Failed to parse user info:', e);
          setUserRole('customer');
        }
      } else {
        setUserRole('customer');
      }
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  // If user is customer, show customer promotions page
  // If user is employee/admin, show admin promotions list
  const isEmployee = userRole === 'employee' || userRole === 'adminshop' || userRole === 'admin';

  if (isEmployee) {
    return (
      <>
        <PageHeader onRefresh={() => setRefreshKey(prev => prev + 1)} />
        <Content className="block py-0">
          <PromotionsList key={refreshKey} />
        </Content>
      </>
    );
  }

  // Customer view
  return <CustomerPromotionsPage />;
}
