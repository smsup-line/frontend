'use client';

import { useState, useEffect } from 'react';
import CustomerPromotionsPage from './customer-promotions-page';
import EmployeePromotionsPage from './employee-promotions-page';

export default function PromotionsPage() {
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
  // If user is employee/admin, show employee promotions page
  const isEmployee = userRole === 'employee' || userRole === 'adminshop' || userRole === 'admin';

  if (isEmployee) {
    return <EmployeePromotionsPage />;
  }

  // Customer view
  return <CustomerPromotionsPage />;
}
