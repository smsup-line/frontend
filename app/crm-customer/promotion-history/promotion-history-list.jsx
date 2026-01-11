'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Search, Settings2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardFooter,
  CardHeader,
  CardHeading,
  CardTable,
  CardToolbar,
} from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { promotionHistoryApi, promotionsApi, customerApi, storeApi, branchApi } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useSearchParams } from 'next/navigation';

export default function PromotionHistoryList({ refreshKey = 0 }) {
  const [history, setHistory] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stores, setStores] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
  });
  const [sorting, setSorting] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [storeFilter, setStoreFilter] = useState('all');
  const [promotionFilter, setPromotionFilter] = useState('all');
  const [userRole, setUserRole] = useState(null);
  const [userStoreId, setUserStoreId] = useState(null);
  const searchParams = useSearchParams();
  const urlPromotionId = searchParams?.get('promotion_id');

  useEffect(() => {
    loadUserInfo();
    loadPromotions();
    loadCustomers();
    loadStores();
    loadBranches();
  }, []);

  useEffect(() => {
    loadData();
  }, [refreshKey, storeFilter, promotionFilter]);

  useEffect(() => {
    loadData();
  }, [storeFilter, promotionFilter]);

  const loadUserInfo = () => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserRole(user.role);
          setUserStoreId(user.shop_id || user.storeId);
          if (user.role !== 'superadmin') {
            setStoreFilter(user.shop_id || user.storeId || 'all');
          }
        } catch (e) {
          console.error('Failed to parse user info:', e);
        }
      }
    }
  };

  useEffect(() => {
    if (urlPromotionId) {
      setPromotionFilter(urlPromotionId);
    }
  }, [urlPromotionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      
      // Filter by promotion_id from URL or filter
      const promotionId = urlPromotionId || (promotionFilter !== 'all' ? promotionFilter : null);
      if (promotionId) {
        params.promotion_id = promotionId;
      }
      
      // Filter by store
      if (userRole === 'admin' && userStoreId) {
        params.shop_id = userStoreId;
      } else if (userRole === 'superadmin' && storeFilter !== 'all') {
        params.shop_id = storeFilter;
      }
      
      const historyData = await promotionHistoryApi.getAll(params);
      setHistory(Array.isArray(historyData) ? historyData : []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPromotions = async () => {
    try {
      const data = await promotionsApi.getAll();
      setPromotions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load promotions:', error);
    }
  };

  const loadCustomers = async () => {
    try {
      const data = await customerApi.getAll();
      setCustomers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const loadStores = async () => {
    try {
      const data = await storeApi.getAll();
      setStores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load stores:', error);
    }
  };

  const loadBranches = async () => {
    try {
      const data = await branchApi.getAll();
      setBranches(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load branches:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('คุณต้องการลบประวัติการใช้โปรโมชั่นนี้หรือไม่?')) return;
    
    try {
      await promotionHistoryApi.delete(id);
      toast.success('ลบประวัติการใช้โปรโมชั่นสำเร็จ');
      loadData();
    } catch (error) {
      console.error('Failed to delete promotion history:', error);
      toast.error('ไม่สามารถลบประวัติการใช้โปรโมชั่นได้');
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const currentItem = history.find(item => item.id === id);
      if (!currentItem) {
        toast.error('ไม่พบข้อมูล');
        return;
      }

      await promotionHistoryApi.update(id, {
        promotion_id: currentItem.promotion_id,
        customer_id: currentItem.customer_id,
        points_used: currentItem.points_used,
        status: newStatus,
        shop_id: currentItem.shop_id,
        branch_id: currentItem.branch_id,
      });
      
      toast.success('อัปเดตสถานะสำเร็จ');
      loadData();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('ไม่สามารถอัปเดตสถานะได้');
    }
  };

  const getPromotionName = (promotionId) => {
    const promotion = promotions.find(p => p.id === promotionId);
    return promotion?.name || '-';
  };

  const getCustomerName = (customerId) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.name || '-';
  };

  const getStoreName = (shopId) => {
    const store = stores.find(s => s.id === shopId);
    return store?.name || '-';
  };

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id === branchId);
    return branch?.name || '-';
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      pending: 'รอดำเนินการ',
      approved: 'อนุมัติ',
      rejected: 'ไม่อนุมัติ',
    };
    return statusMap[status] || status;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd/MM/yyyy HH:mm');
    } catch {
      return '-';
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
        accessorKey: 'promotion_id',
        id: 'promotion_id',
        header: ({ column }) => (
          <DataGridColumnHeader title="โปรโมชั่น" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const promotionId = row.original.promotion_id;
          return (
            <div className="font-medium text-foreground">
              {getPromotionName(promotionId)}
            </div>
          );
        },
        size: 200,
        enableSorting: true,
        enableHiding: false,
        enableResizing: true,
      },
      {
        accessorKey: 'customer_id',
        id: 'customer_id',
        header: ({ column }) => (
          <DataGridColumnHeader title="ลูกค้า" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const customerId = row.original.customer_id;
          return (
            <div className="text-foreground">
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
        accessorKey: 'points_used',
        id: 'points_used',
        header: ({ column }) => (
          <DataGridColumnHeader title="ใช้คะแนนสะสม" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const points = row.original.points_used || 0;
          return (
            <div className="text-foreground font-semibold">
              {points.toLocaleString()} คะแนน
            </div>
          );
        },
        size: 150,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'status',
        id: 'status',
        header: ({ column }) => (
          <DataGridColumnHeader title="สถานะ" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const status = row.original.status;
          const itemId = row.original.id;
          return (
            <Select
              value={status}
              onValueChange={(newStatus) => handleUpdateStatus(itemId, newStatus)}>
              <SelectTrigger className="w-[150px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">รอดำเนินการ</SelectItem>
                <SelectItem value="approved">อนุมัติ</SelectItem>
                <SelectItem value="rejected">ไม่อนุมัติ</SelectItem>
              </SelectContent>
            </Select>
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
          <DataGridColumnHeader title="ร้านค้า" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const shopId = row.original.shop_id;
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
        accessorKey: 'branch_id',
        id: 'branch_id',
        header: ({ column }) => (
          <DataGridColumnHeader title="สาขา" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const branchId = row.original.branch_id;
          return (
            <div className="text-foreground">
              {getBranchName(branchId)}
            </div>
          );
        },
        size: 200,
        enableSorting: true,
        enableHiding: true,
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
        size: 180,
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
                onClick={() => handleDelete(row.original.id)}
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
    [promotions, customers, stores, branches, history, userRole]
  );

  const [columnOrder, setColumnOrder] = useState(
    columns.map((column) => column.id)
  );

  const filteredData = useMemo(() => {
    let filtered = history;

    if (userRole === 'admin' && userStoreId) {
      filtered = filtered.filter((item) => item.shop_id === userStoreId);
    } else if (userRole === 'superadmin' && storeFilter !== 'all') {
      filtered = filtered.filter((item) => item.shop_id === storeFilter);
    }

    if (promotionFilter !== 'all') {
      filtered = filtered.filter((item) => item.promotion_id === promotionFilter);
    }

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        return (
          getPromotionName(item.promotion_id).toLowerCase().includes(searchLower) ||
          getCustomerName(item.customer_id).toLowerCase().includes(searchLower) ||
          getStoreName(item.shop_id).toLowerCase().includes(searchLower) ||
          getBranchName(item.branch_id).toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  }, [searchQuery, storeFilter, promotionFilter, history, promotions, customers, stores, branches, userRole, userStoreId]);

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
    <>
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
                    className="ps-9 w-64"
                  />
                </div>
                {userRole === 'superadmin' && (
                  <Select value={storeFilter} onValueChange={setStoreFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="เลือกร้านค้า" />
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
                <Select value={promotionFilter} onValueChange={setPromotionFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="เลือกโปรโมชั่น" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {promotions.map((promotion) => (
                      <SelectItem key={promotion.id} value={promotion.id}>
                        {promotion.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            <ScrollArea className="h-[calc(100dvh-20rem)]">
              <DataGridTable table={table} />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
          <CardFooter className="px-4 py-3">
            <DataGridPagination table={table} />
          </CardFooter>
        </Card>
      </DataGrid>
    </>
  );
}

