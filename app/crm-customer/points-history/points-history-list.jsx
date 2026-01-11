'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Search, Settings2, X, Info, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardFooter,
  CardHeader,
  CardHeading,
  CardTable,
  CardToolbar,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridColumnVisibility } from '@/components/ui/data-grid-column-visibility';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import {
  DataGridTable,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { pointsApi, storeApi, customerApi, settingsApi } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function PointsHistoryList({ refreshKey = 0 }) {
  const [pointsHistory, setPointsHistory] = useState([]);
  const [stores, setStores] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userStoreId, setUserStoreId] = useState(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
  });
  const [sorting, setSorting] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [storeFilter, setStoreFilter] = useState('all');
  const [selectedStoreSettings, setSelectedStoreSettings] = useState(null);

  useEffect(() => {
    loadUserInfo();
  }, []);

  useEffect(() => {
    if (userRole !== null) {
      loadData();
    }
  }, [userRole, userStoreId, storeFilter, refreshKey]);

  const loadUserInfo = () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          const role = user.role || user.level;
          const shopId = user.shop_id || user.storeId || user.store_id || user.shopId;
          setUserRole(role);
          setUserStoreId(shopId);
        } catch (e) {
          console.error('Failed to parse user info:', e);
        }
      }
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading points history data...', { userRole, userStoreId });
      
      // ดึงข้อมูล stores และ customers ก่อน
      const [storesData, customersData] = await Promise.all([
        storeApi.getAll(),
        customerApi.getAll(),
      ]);
      
      console.log('Stores loaded:', storesData?.length || 0);
      console.log('Customers loaded:', customersData?.length || 0);
      
      setStores(Array.isArray(storesData) ? storesData : []);
      
      // ดึงคะแนนสะสมของลูกค้าทั้งหมด
      const allPoints = [];
      
      // Filter customers by shop_id
      let customersToProcess = Array.isArray(customersData) ? customersData : [];
      let targetShopId = null;
      
      if (userRole === 'admin' && userStoreId) {
        // Admin: ใช้ shop_id ของตัวเอง
        targetShopId = userStoreId;
        customersToProcess = customersToProcess.filter(
          (c) => (c.shop_id || c.storeId) === targetShopId
        );
        console.log(`Filtered customers for admin (shop_id: ${targetShopId}):`, customersToProcess.length);
      } else if (userRole === 'superadmin' && storeFilter !== 'all') {
        // Superadmin: ใช้ shop_id ที่เลือก
        targetShopId = storeFilter;
        customersToProcess = customersToProcess.filter(
          (c) => (c.shop_id || c.storeId) === targetShopId
        );
        console.log(`Filtered customers for superadmin (shop_id: ${targetShopId}):`, customersToProcess.length);
        
        // ดึง settings ของร้านค้าที่เลือก
        try {
          const settings = await settingsApi.getByShopId(targetShopId);
          console.log('Loaded settings for selected store:', settings);
          setSelectedStoreSettings(settings);
        } catch (error) {
          console.error('Failed to load settings:', error);
          setSelectedStoreSettings(null);
        }
      } else if (userRole === 'superadmin' && storeFilter === 'all') {
        // Superadmin: เลือก "ทั้งหมด" ไม่ต้อง filter
        setSelectedStoreSettings(null);
      }
      
      // Set customers ที่ filter แล้ว
      setCustomers(customersToProcess);
      
      if (customersToProcess.length > 0) {
        console.log(`Loading points for ${customersToProcess.length} customers...`);
        
        // ดึงคะแนนของแต่ละลูกค้า
        const pointsPromises = customersToProcess.map(async (customer) => {
          try {
            const customerId = customer.id;
            if (!customerId) {
              console.warn('Customer missing id:', customer);
              return [];
            }
            
            const points = await pointsApi.getByCustomerId(customerId);
            console.log(`Loaded points for customer ${customerId} (${customer.name}):`, points);
            
            // ถ้า points เป็น array ให้ map เพิ่ม customerId และ customer name
            if (Array.isArray(points) && points.length > 0) {
              return points.map((point) => ({
                ...point,
                customer_id: customerId, // Ensure customer_id is set
                customerId: customerId,
                customerName: customer.name || customer.username || '-',
              }));
            }
            // ถ้า points ไม่ใช่ array หรือเป็น empty array
            if (points && !Array.isArray(points)) {
              // ถ้าเป็น object เดียว ให้แปลงเป็น array
              return [{
                ...points,
                customer_id: customerId,
                customerId: customerId,
                customerName: customer.name || customer.username || '-',
              }];
            }
            return [];
          } catch (error) {
            console.error(`Failed to load points for customer ${customer.id}:`, error);
            // Don't throw, just return empty array
            return [];
          }
        });
        
        const pointsResults = await Promise.all(pointsPromises);
        // รวมคะแนนทั้งหมดเข้าด้วยกัน
        allPoints.push(...pointsResults.flat());
        console.log(`Total points loaded: ${allPoints.length}`, allPoints);
      } else {
        console.warn('No customers to process');
      }
      
      setPointsHistory(allPoints);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
      setPointsHistory([]);
      setStores([]);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const getCustomerName = (customerId) => {
    if (!customerId) return '-';
    const customer = customers.find((c) => c.id === customerId);
    return customer?.name || customer?.username || '-';
  };

  const getStoreName = (storeId) => {
    const store = stores.find((s) => s.id === storeId);
    return store?.name || '-';
  };

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm');
    } catch {
      return '-';
    }
  };

  const handleDelete = async (pointsHistoryItem) => {
    if (!confirm('คุณต้องการลบประวัติคะแนนสะสมนี้หรือไม่?')) return;
    
    const customerId = pointsHistoryItem.customer_id || pointsHistoryItem.customerId;
    const pointsId = pointsHistoryItem.id;
    
    if (!customerId || !pointsId) {
      toast.error('ไม่พบข้อมูลลูกค้าหรือรหัสประวัติคะแนนสะสม');
      return;
    }
    
    try {
      await pointsApi.delete(customerId, pointsId);
      toast.success('ลบประวัติคะแนนสะสมสำเร็จ');
      loadData();
    } catch (error) {
      console.error('Failed to delete points history:', error);
      toast.error('ไม่สามารถลบประวัติคะแนนสะสมได้');
    }
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'id',
        id: 'id',
        header: () => <DataGridTableRowSelectAll size="sm" />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} size="sm" />,
        enableSorting: false,
        size: 40,
        meta: {
          headerClassName: 'ps-4',
          cellClassName: 'ps-4',
        },
        enableHiding: false,
        enableResizing: false,
      },
      {
        accessorKey: 'customer_id',
        id: 'customer_id',
        header: ({ column }) => (
          <DataGridColumnHeader title="รหัสลูกค้า" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const customerId = row.original.customer_id || row.original.customerId;
          return (
            <div className="font-medium text-foreground">
              {getCustomerName(customerId)}
            </div>
          );
        },
        size: 200,
        enableSorting: true,
        enableHiding: false,
        enableResizing: true,
      },
      {
        accessorKey: 'detail',
        id: 'detail',
        header: ({ column }) => (
          <DataGridColumnHeader title="รายละเอียดคะแนนสะสม" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const detail = row.original.detail || row.original.description;
          return (
            <div className="truncate max-w-[300px]">
              {detail || '-'}
            </div>
          );
        },
        size: 300,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'points',
        id: 'points',
        header: ({ column }) => (
          <DataGridColumnHeader title="คะแนนสะสม" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const points = row.original.points || 0;
          return (
            <div className="text-foreground font-semibold">
              {points > 0 ? `+${points}` : points}
            </div>
          );
        },
        size: 150,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'shop_id',
        id: 'shop_id',
        header: ({ column }) => (
          <DataGridColumnHeader title="รหัสร้านค้า" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const shopId = row.original.shop_id || row.original.storeId;
          return (
            <div className="text-foreground">
              {getStoreName(shopId)}
            </div>
          );
        },
        size: 200,
        enableSorting: true,
        enableHiding: userRole === 'superadmin',
        enableResizing: true,
      },
      {
        accessorKey: 'created_at',
        id: 'created_at',
        header: ({ column }) => (
          <DataGridColumnHeader title="วันที่สร้าง" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const createdAt = row.original.created_at || row.original.createdAt;
          return (
            <div className="text-foreground">
              {formatDate(createdAt)}
            </div>
          );
        },
        size: 200,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'actions',
        id: 'actions',
        header: () => <div className="text-center">จัดการ</div>,
        cell: ({ row }) => {
          return (
            <div className="flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDelete(row.original)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                <Trash2 className="size-4" />
              </Button>
            </div>
          );
        },
        size: 100,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
    ],
    [customers, stores]
  );

  const [columnOrder, setColumnOrder] = useState(
    columns.map((column) => column.id)
  );

  const filteredData = useMemo(() => {
    let filtered = pointsHistory;

    // Filter by store (for admin role, only show their store)
    if (userRole === 'admin' && userStoreId) {
      filtered = filtered.filter((item) => {
        const itemShopId = item.shop_id || item.storeId;
        return itemShopId === userStoreId;
      });
    } else if (userRole === 'superadmin' && storeFilter !== 'all') {
      filtered = filtered.filter((item) => {
        const itemShopId = item.shop_id || item.storeId;
        return itemShopId === storeFilter;
      });
    }

    // Filter by search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        const customerId = item.customer_id || item.customerId;
        const customerName = getCustomerName(customerId);
        const itemShopId = item.shop_id || item.storeId;
        const storeName = getStoreName(itemShopId);
        const detail = item.detail || item.description || '';
        return (
          customerName.toLowerCase().includes(searchLower) ||
          detail.toLowerCase().includes(searchLower) ||
          (item.points?.toString() || '').includes(searchLower) ||
          storeName.toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  }, [searchQuery, storeFilter, pointsHistory, customers, stores, userRole, userStoreId]);

  const table = useReactTable({
    columns,
    data: filteredData,
    pageCount: Math.ceil((filteredData?.length || 0) / pagination.pageSize),
    getRowId: (row) => row.id?.toString() || Math.random().toString(),
    state: {
      pagination,
      sorting,
      columnOrder,
    },
    columnResizeMode: 'onChange',
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {userRole === 'superadmin' && storeFilter !== 'all' && selectedStoreSettings && (
        <Alert>
          <AlertIcon>
            <Info className="size-4" />
          </AlertIcon>
          <AlertTitle>ตั้งค่าร้านค้า</AlertTitle>
          <AlertDescription>
            <div className="space-y-1 mt-2">
              <p>
                <span className="font-medium">ตัวอักษรใช้จับยอดใบเสร็จรับเงิน:</span>{' '}
                <span className="font-semibold">
                  {selectedStoreSettings.total_check_tax || '(ยังไม่ได้ตั้งค่า)'}
                </span>
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}
      <DataGrid
        table={table}
        recordCount={filteredData?.length || 0}
        tableClassNames={{
          bodyRow: 'group/row',
        }}
        tableLayout={{
          dense: true,
          columnsPinnable: true,
          columnsResizable: true,
          columnsMovable: true,
          columnsVisibility: true,
        }}>
        <Card className="border-none shadow-none">
        <CardHeader className="px-4 py-3">
          <CardHeading>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                <Input
                  variant="sm"
                  placeholder="ค้นหา..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 w-40"
                />
                {searchQuery.length > 0 && (
                  <Button
                    mode="icon"
                    variant="ghost"
                    className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                    onClick={() => setSearchQuery('')}>
                    <X />
                  </Button>
                )}
              </div>
              {userRole === 'superadmin' && (
                <Select value={storeFilter} onValueChange={setStoreFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="กรองตามร้านค้า" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {stores.map((store) => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </CardHeading>
          <CardToolbar>
            <DataGridColumnVisibility
              table={table}
              trigger={
                <Button size="sm" variant="outline">
                  <Settings2 />
                  การตั้งค่าการแสดงผล
                </Button>
              }
            />
          </CardToolbar>
        </CardHeader>

        <CardTable>
          <ScrollArea>
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardTable>

        <CardFooter className="px-4 py-0">
          <DataGridPagination
            className="py-1"
            sizes={[5, 10, 15, 30, 50, 100]}
          />
        </CardFooter>
      </Card>
    </DataGrid>
    </div>
  );
}

