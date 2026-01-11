'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, ScanLine, Check, X, Eye, Loader2, User, UserPlus, LogOut, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Content } from '@/components/layouts/crm/components/content';
import { toast } from 'sonner';
import { receiptsApi, employeeApi, pointsApi } from '@/lib/api';
import Link from 'next/link';
import { createWorker } from 'tesseract.js';

export default function EmployeeReceiptScannerPage() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [settings, setSettings] = useState(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [receiptToApprove, setReceiptToApprove] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrError, setOcrError] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (!loading && user && userDetails) {
      loadReceipts();
      // Settings is already loaded from employeetokenline in loadUserData
    }
  }, [loading, user, userDetails]);

  useEffect(() => {
    console.log('=== APPROVAL DIALOG STATE CHANGE ===');
    console.log('isApprovalDialogOpen:', isApprovalDialogOpen);
    console.log('receiptToApprove:', receiptToApprove);
  }, [isApprovalDialogOpen, receiptToApprove]);

  const loadUserData = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);

        const userRole = userData.role || userData.user_type || 'customer';
        const isEmployee = userRole === 'employee';

        if (!isEmployee) {
          toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
          router.push('/crm-customer/profile');
          return;
        }

        const lineToken = userData.line_token || localStorage.getItem('line_token');
        if (lineToken) {
          try {
            console.log('Loading employee details and settings from employeetokenline');
            const employeeResponse = await employeeApi.getByLineToken(lineToken);
            if (employeeResponse.exists === true && employeeResponse.employee) {
              setUserDetails(employeeResponse.employee);
              const settingsData = employeeResponse.settings || null;
              console.log('Settings from employeetokenline:', settingsData);
              setSettings(settingsData);
            } else if (employeeResponse.employee) {
              setUserDetails(employeeResponse.employee);
              const settingsData = employeeResponse.settings || null;
              console.log('Settings from employeetokenline (alternative format):', settingsData);
              setSettings(settingsData);
            }
          } catch (error) {
            console.error('Failed to load employee details:', error);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };


  const loadReceipts = async () => {
    if (!userDetails?.shop_id) {
      console.log('Cannot load receipts: shop_id is missing');
      return;
    }

    try {
      setLoadingReceipts(true);
      console.log('Loading employee receipts for shop_id:', userDetails.shop_id, 'branch_id:', userDetails.branch_id);
      const authToken = localStorage.getItem('auth_token');
      console.log('Auth token:', authToken ? 'present' : 'missing');
      if (authToken) {
        console.log('Token (first 20 chars):', authToken.substring(0, 20) + '...');
      }

      // Use employee-receipts endpoint with shop_id and branch_id
      const data = await receiptsApi.getEmployeeReceipts(userDetails.shop_id, userDetails.branch_id || null);
      console.log('Employee receipts API response:', data);
      const receiptsList = Array.isArray(data) ? data : [];
      console.log('Receipts list length:', receiptsList.length);

      // Sort by created_at descending (newest first)
      receiptsList.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      });

      setReceipts(receiptsList);
      console.log('Employee receipts loaded successfully:', receiptsList.length);
    } catch (error) {
      console.error('Failed to load employee receipts:', error);
      console.error('Error message:', error.message);
      console.error('Error status:', error.status);
      console.error('Error data:', error.data);
      setReceipts([]);
    } finally {
      setLoadingReceipts(false);
    }
  };

  const extractTotalCheckTax = (text) => {
    // Patterns to find total amount in Thai receipts
    // Common patterns: "รวม", "ยอดรวม", "รวมทั้งสิ้น", "Total", "TOTAL", etc.
    const lines = text.split('\n');
    
    // Look for lines containing "รวม" or "Total" followed by numbers
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      
      // Check for Thai patterns
      if (line.match(/รวม.*?[\d,]+\.?\d*/i) || line.match(/ยอดรวม.*?[\d,]+\.?\d*/i)) {
        const match = line.match(/[\d,]+\.?\d*/);
        if (match) {
          const amount = parseFloat(match[0].replace(/,/g, ''));
          if (amount > 0) {
            return amount;
          }
        }
      }
      
      // Check for English patterns
      if (line.match(/total.*?[\d,]+\.?\d*/i)) {
        const match = line.match(/[\d,]+\.?\d*/);
        if (match) {
          const amount = parseFloat(match[0].replace(/,/g, ''));
          if (amount > 0) {
            return amount;
          }
        }
      }
      
      // Check for lines that are just numbers (likely the total at the end)
      if (i === lines.length - 1 || i === lines.length - 2) {
        const numberMatch = line.match(/^[\d,]+\.?\d*$/);
        if (numberMatch) {
          const amount = parseFloat(numberMatch[0].replace(/,/g, ''));
          if (amount > 0 && amount < 10000000) { // Reasonable upper limit
            return amount;
          }
        }
      }
    }
    
    return null;
  };

  const performOCR = async (imageUrl) => {
    try {
      setOcrLoading(true);
      setOcrError(null);
      setOcrResult(null);

      const worker = await createWorker('tha+eng');
      
      const { data: { text } } = await worker.recognize(imageUrl);
      await worker.terminate();

      console.log('OCR Text:', text);
      
      const extractedAmount = extractTotalCheckTax(text);
      
      if (extractedAmount) {
        setOcrResult({
          text,
          amount: extractedAmount,
        });
        toast.success(`อ่านยอดเงินได้: ${extractedAmount.toLocaleString('th-TH')} บาท`);
      } else {
        setOcrError('ไม่สามารถอ่านยอดเงินจากใบเสร็จได้');
        setOcrResult({ text, amount: null });
        toast.error('ไม่สามารถอ่านยอดเงินจากใบเสร็จได้');
      }
    } catch (error) {
      console.error('OCR Error:', error);
      setOcrError('เกิดข้อผิดพลาดในการอ่านใบเสร็จ');
      toast.error('เกิดข้อผิดพลาดในการอ่านใบเสร็จ');
    } finally {
      setOcrLoading(false);
    }
  };

  const handleViewImage = async (receipt) => {
    setSelectedReceipt(receipt);
    setIsImageDialogOpen(true);
    setOcrResult(null);
    setOcrError(null);
    
    // Auto-perform OCR when viewing image
    if (receipt.receipt_image_url) {
      await performOCR(receipt.receipt_image_url);
    }
  };

  const handleApproveClick = async (receipt) => {
    console.log('=== HANDLE APPROVE CLICK ===');
    console.log('Receipt:', receipt);
    console.log('Receipt total_check_tax:', receipt.total_check_tax);
    
    // If total_check_tax is missing, try to read from OCR
    if (!receipt.total_check_tax && receipt.receipt_image_url) {
      toast.info('กำลังอ่านยอดเงินจากใบเสร็จ...');
      await performOCR(receipt.receipt_image_url);
    }
    
    // Always open popup modal for approval confirmation
    // Even if total_check_tax is missing, user can still approve
    console.log('Opening approval dialog for receipt:', receipt.id);
    setReceiptToApprove(receipt);
    setIsApprovalDialogOpen(true);
    console.log('Dialog opened, isApprovalDialogOpen set to true');
  };

  const handleApproveConfirm = async () => {
    if (!receiptToApprove) return;

    // Use total_check_tax from receipt data or OCR result
    let totalCheckTax = receiptToApprove.total_check_tax || '';
    
    // If no total_check_tax in receipt but we have OCR result, use it
    if (!totalCheckTax && ocrResult && ocrResult.amount) {
      totalCheckTax = ocrResult.amount.toString();
    }
    
    const totalCheckTaxValue = totalCheckTax ? parseFloat(totalCheckTax.toString()) : null;

    // Get total_check_tax value (can be 0 or null if OCR failed)
    const finalTotalCheckTax = (totalCheckTaxValue && !isNaN(totalCheckTaxValue) && totalCheckTaxValue > 0) 
      ? totalCheckTaxValue 
      : null;

    console.log('=== APPROVE CONFIRM ===');
    console.log('Receipt ID:', receiptToApprove.id);
    console.log('Total check tax value:', finalTotalCheckTax);
    console.log('OCR result:', ocrResult);

    setIsApprovalDialogOpen(false);
    await handleUpdateStatus(receiptToApprove.id, 'approved', finalTotalCheckTax);
    setReceiptToApprove(null);
    setOcrResult(null);
  };

  const handleUpdateStatus = async (receiptId, newStatus, totalCheckTaxValue = null) => {
    // For rejected status, no confirmation needed - update directly
    // For approved status, this is called from handleApproveConfirm after popup confirmation

    try {
      setUpdatingStatus(receiptId);

      // Get receipt data
      const receipt = receipts.find(r => r.id === receiptId);
      if (!receipt) {
        toast.error('ไม่พบข้อมูลใบเสร็จ');
        return;
      }

      // Update receipt status and description
      const updateData = {
        status: newStatus,
        description: newStatus === 'approved' ? 'อนุมัติแล้ว' : newStatus === 'rejected' ? 'ไม่อนุมัติ' : receipt.description || 'ใบเสร็จรับเงิน',
      };
      if (totalCheckTaxValue !== null && totalCheckTaxValue > 0) {
        updateData.total_check_tax = totalCheckTaxValue.toString();
      }

      console.log('=== UPDATING RECEIPT STATUS ===');
      console.log('Receipt ID:', receiptId);
      console.log('Status:', newStatus);
      console.log('Update data:', updateData);
      
      await receiptsApi.update(receiptId, updateData);
      
      console.log('Receipt status updated successfully');

      // If approved, add points to customer
      if (newStatus === 'approved' && totalCheckTaxValue > 0) {
        try {
          // Get rate_total_point from settings
          const rateTotalPoint = settings?.rate_total_point || '';
          const rateTotalPointValue = rateTotalPoint ? parseFloat(rateTotalPoint.toString()) : 0;

          if (rateTotalPointValue > 0) {
            const pointsToAdd = Math.round(totalCheckTaxValue * rateTotalPointValue);
            
            console.log('Adding points to customer:', {
              customerId: receipt.customer_id,
              points: pointsToAdd,
              rateTotalPoint: rateTotalPointValue,
              totalCheckTax: totalCheckTaxValue,
            });

            // Use POST /points with customer_id in body
            await pointsApi.addPoints(receipt.customer_id, {
              detail: 'สแกนใบเสร็จ',
              points: pointsToAdd,
            });
            toast.success(`อนุมัติใบเสร็จและเพิ่มคะแนน ${pointsToAdd} คะแนนให้ลูกค้าแล้ว`);
          } else {
            toast.success('อนุมัติใบเสร็จแล้ว (ไม่สามารถคำนวณคะแนนได้ - rate_total_point ไม่ถูกตั้งค่า)');
          }
        } catch (pointsError) {
          console.error('Failed to add points:', pointsError);
          toast.error('อนุมัติใบเสร็จแล้ว แต่ไม่สามารถเพิ่มคะแนนได้');
        }
      } else if (newStatus === 'approved') {
        toast.success('อนุมัติใบเสร็จแล้ว (ไม่สามารถคำนวณคะแนนได้ - ยอดรวมไม่ถูกต้อง)');
      } else {
        toast.success('ไม่อนุมัติใบเสร็จแล้ว');
      }

      // Reload receipts
      await loadReceipts();
    } catch (error) {
      console.error('Failed to update receipt status:', error);
      toast.error('ไม่สามารถอัปเดตสถานะได้');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
      localStorage.removeItem('line_token');
      localStorage.removeItem('shop_id');
      localStorage.removeItem('branch_id');

      if (typeof window !== 'undefined' && window.liff) {
        try {
          window.liff.logout();
        } catch (liffError) {
          console.log('LIFF logout error (non-critical):', liffError);
        }
      }

      toast.success('ออกจากระบบสำเร็จ');
      router.push('/crm-customer/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning" appearance="light" size="sm">รอดำเนินการ</Badge>;
      case 'approved':
        return <Badge variant="success" appearance="light" size="sm">อนุมัติ</Badge>;
      case 'rejected':
        return <Badge variant="destructive" appearance="light" size="sm">ไม่อนุมัติ</Badge>;
      default:
        return <Badge variant="secondary" appearance="light" size="sm">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const displayUser = userDetails || user;
  const userName = displayUser?.name || user?.name || 'ผู้ใช้งาน';
  const userAvatar = displayUser?.avatar_url || user?.avatar_url || '';
  const userPhone = displayUser?.phone || user?.phone || '-';

  return (
    <div className="min-h-screen bg-background w-full">
      <header className="sticky top-0 z-10 bg-background border-b border-border w-full">
        <div className="w-full mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold truncate">สแกนใบเสร็จ</h1>
          
          <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" mode="icon" size="lg" className="flex-shrink-0">
                <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-80 max-w-sm">
              <SheetTitle className="sr-only">เมนู</SheetTitle>
              <SheetHeader>
                <div className="flex items-center gap-3 pb-4">
                  <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
                    <AvatarImage src={userAvatar} alt={userName} />
                    <AvatarFallback className="text-sm sm:text-base">{userName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm sm:text-base truncate">{userName}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">{userPhone}</p>
                  </div>
                </div>
              </SheetHeader>
              <SheetBody className="pt-4">
                <nav className="space-y-2">
                  <Link href="/crm-customer/profile">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm sm:text-base"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="mr-2 h-4 w-4" />
                      หน้าโปรไฟล์
                    </Button>
                  </Link>
                  
                  <Link href="/crm-customer/add-customer">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm sm:text-base"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      เพิ่มลูกค้า
                    </Button>
                  </Link>
                  
                  <Link href="/crm-customer/approve-promotions">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm sm:text-base"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      ยืนยันโปรโมชั่น
                    </Button>
                  </Link>
                  
                  <Link href="/crm-customer/receipt-scanner/employee">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm sm:text-base"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <ScanLine className="mr-2 h-4 w-4" />
                      สแกนใบเสร็จ
                    </Button>
                  </Link>
                  
                  <Separator className="my-4" />
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-destructive hover:text-destructive text-sm sm:text-base"
                    onClick={handleLogout}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    ออกจากระบบ
                  </Button>
                </nav>
              </SheetBody>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      <Content className="block px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8 w-full">
        <div className="container mx-auto max-w-4xl space-y-4 sm:space-y-5 md:space-y-6">
          <div className="rounded-lg border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">รายการใบเสร็จรับเงิน</h3>
            
            {loadingReceipts ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : receipts.length === 0 ? (
              <div className="text-center py-8">
                <ScanLine className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                <p className="text-sm sm:text-base text-muted-foreground">ยังไม่มีรายการใบเสร็จรับเงิน</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {receipts.map((receipt) => {
                  const receiptDate = receipt.created_at 
                    ? new Date(receipt.created_at).toLocaleString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : '-';
                  
                  return (
                    <div
                      key={receipt.id}
                      className="rounded-lg border border-border bg-card p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        {receipt.receipt_image_url && (
                          <div className="relative w-full sm:w-32 md:w-40 h-32 sm:h-auto flex-shrink-0 cursor-pointer" onClick={() => handleViewImage(receipt)}>
                            <img
                              src={receipt.receipt_image_url}
                              alt={receipt.description || 'ใบเสร็จรับเงิน'}
                              className="w-full h-full object-cover rounded-lg"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'flex';
                                }
                              }}
                            />
                            <div
                              className={`w-full h-full bg-muted flex items-center justify-center rounded-lg ${receipt.receipt_image_url ? 'hidden' : ''}`}
                            >
                              <ScanLine className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                            </div>
                            <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                              <Eye className="h-6 w-6 sm:h-8 sm:w-8 text-white opacity-0 hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <p className="text-sm sm:text-base font-medium break-words">
                              {receipt.description || 'ใบเสร็จรับเงิน'}
                            </p>
                            {getStatusBadge(receipt.status)}
                          </div>
                          
                          <div className="space-y-1 mb-3 sm:mb-4">
                            <div>
                              <p className="text-xs sm:text-sm text-muted-foreground">วันที่บันทึก</p>
                              <p className="text-xs sm:text-sm break-words">{receiptDate}</p>
                            </div>
                            {receipt.total_check_tax && (
                              <div>
                                <p className="text-xs sm:text-sm text-muted-foreground">ยอดรวม</p>
                                <p className="text-xs sm:text-sm break-words">{parseFloat(receipt.total_check_tax).toLocaleString('th-TH')} บาท</p>
                              </div>
                            )}
                          </div>

                          {receipt.status === 'pending' && (
                            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => handleApproveClick(receipt)}
                                disabled={updatingStatus === receipt.id}
                                className="flex-1"
                              >
                                <Check className="mr-2 h-4 w-4" />
                                อนุมัติ
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleUpdateStatus(receipt.id, 'rejected')}
                                disabled={updatingStatus === receipt.id}
                                className="flex-1"
                              >
                                {updatingStatus === receipt.id ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    กำลังดำเนินการ...
                                  </>
                                ) : (
                                  <>
                                    <X className="mr-2 h-4 w-4" />
                                    ไม่อนุมัติ
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </Content>

      {/* Image Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={(open) => {
        setIsImageDialogOpen(open);
        if (!open) {
          setOcrResult(null);
          setOcrError(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>ภาพใบเสร็จรับเงิน</DialogTitle>
          </DialogHeader>
          {selectedReceipt?.receipt_image_url && (
            <div className="w-full space-y-4">
              <div className="w-full">
                <img
                  src={selectedReceipt.receipt_image_url}
                  alt={selectedReceipt.description || 'ใบเสร็จรับเงิน'}
                  className="w-full h-auto rounded-lg"
                />
              </div>
              
              {/* OCR Section */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold">ยอดเงินที่อ่านได้</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => performOCR(selectedReceipt.receipt_image_url)}
                    disabled={ocrLoading}
                  >
                    {ocrLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        กำลังอ่าน...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        อ่านยอดเงินใหม่
                      </>
                    )}
                  </Button>
                </div>
                
                {ocrLoading && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">กำลังอ่านยอดเงินจากใบเสร็จ...</span>
                  </div>
                )}
                
                {!ocrLoading && ocrResult && ocrResult.amount && (
                  <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-success">ยอดเงินที่อ่านได้:</span>
                      <span className="text-lg font-bold text-success">
                        {ocrResult.amount.toLocaleString('th-TH')} บาท
                      </span>
                    </div>
                  </div>
                )}
                
                {!ocrLoading && ocrError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">{ocrError}</p>
                  </div>
                )}
                
                {selectedReceipt.total_check_tax && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">ยอดเงินที่บันทึกไว้:</p>
                    <p className="text-sm font-medium">
                      {parseFloat(selectedReceipt.total_check_tax).toLocaleString('th-TH')} บาท
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={(open) => {
        setIsApprovalDialogOpen(open);
        if (!open) {
          setReceiptToApprove(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>อนุมัติใบเสร็จ</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {receiptToApprove && (() => {
              // Use total_check_tax from receipt data or OCR result
              let totalCheckTax = receiptToApprove.total_check_tax || '';
              
              // If no total_check_tax in receipt but we have OCR result, use it
              if (!totalCheckTax && ocrResult && ocrResult.amount) {
                totalCheckTax = ocrResult.amount.toString();
              }
              
              const totalCheckTaxValue = totalCheckTax ? parseFloat(totalCheckTax.toString()) : 0;
              const rateTotalPoint = settings?.rate_total_point || '';
              const rateTotalPointValue = rateTotalPoint ? parseFloat(rateTotalPoint.toString()) : 0;
              const pointsToAdd = totalCheckTaxValue > 0 && rateTotalPointValue > 0 
                ? Math.round(totalCheckTaxValue * rateTotalPointValue) 
                : 0;
              
              return (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>ยอดรวม (บาท)</Label>
                      {receiptToApprove.receipt_image_url && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => performOCR(receiptToApprove.receipt_image_url)}
                          disabled={ocrLoading}
                        >
                          {ocrLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              กำลังอ่าน...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              อ่านยอดเงินใหม่
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                    {ocrLoading && (
                      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-sm text-muted-foreground">กำลังอ่านยอดเงินจากใบเสร็จ...</span>
                      </div>
                    )}
                    <div className="rounded-lg border border-border bg-muted p-4">
                      <p className="text-2xl font-bold text-primary">
                        {totalCheckTaxValue > 0
                          ? totalCheckTaxValue.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : 'ไม่สามารถอ่านได้'}
                      </p>
                    </div>
                    {totalCheckTaxValue <= 0 && !ocrLoading && (
                      <p className="text-xs text-destructive">
                        ไม่สามารถอ่านยอดรวมจากใบเสร็จได้ กรุณากดปุ่ม "อ่านยอดเงินใหม่" เพื่อลองอีกครั้ง
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>คะแนนสะสม</Label>
                    <div className="rounded-lg border border-border bg-card p-4">
                      <p className="text-2xl font-bold text-primary">
                        {pointsToAdd > 0 
                          ? pointsToAdd.toLocaleString('th-TH')
                          : '0'}
                      </p>
                      {pointsToAdd > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          อัตราคะแนน: {rateTotalPointValue} คะแนน/บาท
                        </p>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsApprovalDialogOpen(false);
                setReceiptToApprove(null);
              }}
            >
              ยกเลิก
            </Button>
            <Button
              onClick={handleApproveConfirm}
              disabled={!receiptToApprove}
            >
              ยืนยัน
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

