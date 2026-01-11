'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, ScanLine, Upload, Camera, X, Loader2, User, Coins, Gift, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Content } from '@/components/layouts/crm/components/content';
import { toast } from 'sonner';
import { receiptsApi, customerTokenLineApi } from '@/lib/api';
import { uploadToCloudinary, getImagePreview, revokeImagePreview } from '@/lib/cloudinary';
import Link from 'next/link';
import { createWorker } from 'tesseract.js';

export default function ReceiptScannerForm() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [receipts, setReceipts] = useState([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [totalCheckTax, setTotalCheckTax] = useState(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (!loading && user) {
      loadReceipts();
    }
  }, [loading, user]);

  const loadUserData = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        setUser(userData);

        const userRole = userData.role || userData.user_type || 'customer';
        const isEmployee = userRole === 'employee';

        // เปิดสิทธิ์เฉพาะลูกค้า
        if (isEmployee) {
          toast.error('คุณไม่มีสิทธิ์เข้าถึงหน้านี้');
          router.push('/crm-customer/profile');
          return;
        }

        const lineToken = userData.line_token || localStorage.getItem('line_token');
        if (lineToken) {
          try {
            const customerResponse = await customerTokenLineApi.getByLineToken(lineToken);
            if (customerResponse.exists === true && customerResponse.customer) {
              setUserDetails(customerResponse.customer);
            } else if (customerResponse.customer) {
              setUserDetails(customerResponse.customer);
            }
          } catch (error) {
            console.error('Failed to load customer details:', error);
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
    try {
      setLoadingReceipts(true);
      const data = await receiptsApi.getAll();
      const receiptsList = Array.isArray(data) ? data : [];
      // Sort by created_at descending (newest first)
      receiptsList.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      });
      setReceipts(receiptsList);
      console.log('Receipts loaded:', receiptsList.length);
    } catch (error) {
      console.error('Failed to load receipts:', error);
      setReceipts([]);
    } finally {
      setLoadingReceipts(false);
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

  const performOCR = async (imageFile) => {
    try {
      setOcrLoading(true);
      setOcrError(null);
      setTotalCheckTax(null);

      const worker = await createWorker('tha+eng');
      
      const { data: { text } } = await worker.recognize(imageFile);
      await worker.terminate();

      console.log('OCR Text:', text);
      
      const extractedAmount = extractTotalCheckTax(text);
      
      if (extractedAmount) {
        setTotalCheckTax(extractedAmount);
        toast.success(`อ่านยอดเงินได้: ${extractedAmount.toLocaleString('th-TH')} บาท`);
      } else {
        setOcrError('ไม่สามารถอ่านยอดเงินจากใบเสร็จได้ กรุณาลองใหม่อีกครั้ง');
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

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('กรุณาเลือกรูปภาพเท่านั้น');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('ขนาดไฟล์ต้องไม่เกิน 10MB');
      return;
    }

    setImageFile(file);
    const preview = getImagePreview(file);
    setImagePreview(preview);
    
    // Perform OCR on the image
    await performOCR(file);
  };

  const handleRemoveImage = () => {
    if (imagePreview) {
      revokeImagePreview(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    setTotalCheckTax(null);
    setOcrError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraOpen(false);
    }
  };

  const openCamera = async () => {
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('เบราว์เซอร์ของคุณไม่รองรับการเข้าถึงกล้อง');
        return;
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setStream(mediaStream);
      setIsCameraOpen(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      
      let errorMessage = 'ไม่สามารถเข้าถึงกล้องได้';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'กรุณาอนุญาตให้เข้าถึงกล้องในเบราว์เซอร์ของคุณ';
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        errorMessage = 'ไม่พบกล้องในอุปกรณ์ของคุณ';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'กล้องถูกใช้งานโดยแอปอื่น กรุณาปิดแอปอื่นแล้วลองอีกครั้ง';
      } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
        errorMessage = 'กล้องไม่รองรับการตั้งค่าที่ต้องการ';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'เบราว์เซอร์ของคุณไม่รองรับการเข้าถึงกล้อง';
      } else {
        errorMessage = `ไม่สามารถเข้าถึงกล้องได้: ${error.message || error.name}`;
      }
      
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err);
      });
    } else if (!stream && videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setIsCameraOpen(false);
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(async (blob) => {
      if (!blob) return;

      const file = new File([blob], 'receipt-photo.jpg', { type: 'image/jpeg' });
      setImageFile(file);
      const preview = URL.createObjectURL(blob);
      setImagePreview(preview);
      closeCamera();

      // Perform OCR on the captured image
      await performOCR(file);
    }, 'image/jpeg', 0.9);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="success" appearance="light" size="sm">
            อนุมัติ
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="destructive" appearance="light" size="sm">
            ไม่อนุมัติ
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge variant="warning" appearance="light" size="sm">
            รอดำเนินการ
          </Badge>
        );
    }
  };

  const handleSubmit = async () => {
    if (!imageFile) {
      toast.error('กรุณาเลือกรูปภาพใบเสร็จ');
      return;
    }

    if (!totalCheckTax) {
      toast.error('กรุณารอให้ระบบอ่านยอดเงินจากใบเสร็จก่อน');
          return;
    }

    const displayUser = userDetails || user;
    const customerId = displayUser?.id || user?.id;

    if (!customerId) {
      toast.error('ไม่พบรหัสลูกค้า');
      return;
    }

    const shopId = displayUser?.shop_id || user?.shop_id || localStorage.getItem('shop_id');
    const branchId = displayUser?.branch_id || user?.branch_id || localStorage.getItem('branch_id');

    try {
      setUploading(true);
      
      // Upload image to Cloudinary
      const receiptImageUrl = await uploadToCloudinary(imageFile);
      console.log('Image uploaded to Cloudinary:', receiptImageUrl);

      setUploading(false);
      setSubmitting(true);

      // Submit receipt to backend
      const receiptData = {
        customer_id: customerId,
        receipt_image_url: receiptImageUrl,
        description: 'ใบเสร็จรับเงิน',
        total_check_tax: totalCheckTax.toString(),
        ...(shopId && { shop_id: shopId }),
        ...(branchId && { branch_id: branchId }),
      };

      console.log('Submitting receipt:', receiptData);
      await receiptsApi.create(receiptData);

      toast.success('บันทึกใบเสร็จรับเงินสำเร็จ');
      
      // Reset form
      handleRemoveImage();
      
      // Reload receipts list
      await loadReceipts();
    } catch (error) {
      console.error('Failed to submit receipt:', error);
      toast.error(error.message || 'ไม่สามารถบันทึกใบเสร็จได้');
    } finally {
      setUploading(false);
      setSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreview) {
        revokeImagePreview(imagePreview);
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [imagePreview, stream]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  const displayUser = userDetails || user;
  const userName = displayUser?.name || user?.name || 'ผู้ใช้งาน';
  const userAvatar = displayUser?.avatar_url || user?.avatar_url || '';
  const userPhone = displayUser?.phone || user?.phone || '-';
  const userRole = user?.role || user?.user_type || 'customer';
  const isEmployee = userRole === 'employee';

  // เปิดสิทธิ์เฉพาะลูกค้า
  if (isEmployee) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-destructive">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Header with Hamburger Menu */}
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
                  
                  <Link href="/crm-customer/points-history">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm sm:text-base"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Coins className="mr-2 h-4 w-4" />
                      คะแนนสะสม
                    </Button>
                  </Link>
                  
                  <Link href="/crm-customer/promotions">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm sm:text-base"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Gift className="mr-2 h-4 w-4" />
                      โปรโมชั่น
                    </Button>
                  </Link>
                  
                  <Link href="/crm-customer/my-promotions">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm sm:text-base"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Gift className="mr-2 h-4 w-4" />
                      โปรโมชั่นของฉัน
                    </Button>
                  </Link>
                  
                  <Link href="/crm-customer/receipt-scanner">
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
        <div className="container mx-auto max-w-2xl space-y-4 sm:space-y-5 md:space-y-6">
          {/* Image Upload Section */}
          <div className="rounded-lg border border-border bg-card p-4 sm:p-5 md:p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">อัพโหลดรูปภาพใบเสร็จ</h3>
            
            {!imagePreview ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-xs sm:text-sm">เลือกรูปภาพ</span>
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={openCamera}
                  >
                    <Camera className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="text-xs sm:text-sm">ถ่ายรูป</span>
                  </Button>
                </div>
                
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageSelect}
                />
                
                {isCameraOpen && (
                  <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                      className="w-full h-full object-cover"
                        playsInline
                        muted
                      autoPlay
                      />
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={closeCamera}
                        className="bg-background/80 backdrop-blur-sm"
                      >
                        <X className="mr-2 h-4 w-4" />
                        ยกเลิก
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={capturePhoto}
                        className="bg-primary text-primary-foreground"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        ถ่ายรูป
                      </Button>
                    </div>
                  </div>
                )}
                  </div>
                ) : (
              <div className="space-y-3 sm:space-y-4">
                <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Receipt preview"
                    className="w-full h-full object-contain"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    <X className="h-4 w-4" />
                    </Button>
                        </div>
                
                {/* OCR Status */}
                {ocrLoading && (
                  <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">กำลังอ่านยอดเงินจากใบเสร็จ...</span>
                        </div>
                      )}
                
                {!ocrLoading && totalCheckTax && (
                  <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-success">ยอดเงินที่อ่านได้:</span>
                      <span className="text-lg font-bold text-success">
                        {totalCheckTax.toLocaleString('th-TH')} บาท
                      </span>
                    </div>
                  </div>
                )}
                
                {!ocrLoading && ocrError && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <p className="text-sm text-destructive">{ocrError}</p>
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                          <Button
                            type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || submitting || ocrLoading}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    <span className="text-xs sm:text-sm">เปลี่ยนรูปภาพ</span>
                          </Button>
                  
                            <Button
                              type="button"
                              variant="outline"
                    className="flex-1"
                    onClick={openCamera}
                    disabled={uploading || submitting || ocrLoading}
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    <span className="text-xs sm:text-sm">ถ่ายรูปใหม่</span>
                            </Button>
                          </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                        </div>
                      )}
                    </div>

          {/* Submit Button */}
          {imagePreview && (
            <div className="flex justify-end">
                          <Button
                type="button"
                onClick={handleSubmit}
                disabled={uploading || submitting || ocrLoading || !totalCheckTax}
                className="w-full sm:w-auto min-w-[120px]"
              >
                {uploading || submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="text-xs sm:text-sm">
                      {uploading ? 'กำลังอัพโหลด...' : 'กำลังบันทึก...'}
                    </span>
                  </>
                ) : ocrLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span className="text-xs sm:text-sm">กำลังอ่านใบเสร็จ...</span>
                  </>
                ) : !totalCheckTax ? (
                  <>
                    <X className="mr-2 h-4 w-4" />
                    <span className="text-xs sm:text-sm">ไม่สามารถอ่านยอดเงินได้</span>
                  </>
                ) : (
                  <>
                    <ScanLine className="mr-2 h-4 w-4" />
                    <span className="text-xs sm:text-sm">บันทึกใบเสร็จ</span>
                  </>
                )}
                </Button>
                </div>
              )}

          {/* Receipts List */}
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
                          <div className="relative w-full sm:w-32 md:w-40 h-32 sm:h-auto flex-shrink-0">
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
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm text-muted-foreground">รายละเอียด</p>
                                <p className="text-sm sm:text-base font-medium break-words">
                                  {receipt.description || 'ใบเสร็จรับเงิน'}
                                </p>
              </div>
                              <div className="flex-shrink-0">
                                {getStatusBadge(receipt.status || 'pending')}
                              </div>
                            </div>
                            
              <div>
                              <p className="text-xs sm:text-sm text-muted-foreground">วันที่บันทึก</p>
                              <p className="text-xs sm:text-sm break-words">{receiptDate}</p>
              </div>
              </div>
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
    </div>
  );
}
