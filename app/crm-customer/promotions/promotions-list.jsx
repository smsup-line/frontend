'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Edit, Search, Settings2, Trash2, Eye } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { promotionsApi, storeApi, branchApi } from '@/lib/api';
import { toast } from 'sonner';
import { EditPromotionSheet } from './edit-promotion-sheet';
import { useRouter } from 'next/navigation';

export default function PromotionsList() {
  const [promotions, setPromotions] = useState([]);
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
  const [editPromotion, setEditPromotion] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [userStoreId, setUserStoreId] = useState(null);
  const router = useRouter();

  useEffect(() => {
    loadUserInfo();
    loadStores();
    loadBranches();
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [storeFilter]);

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

  const loadData = async () => {
    try {
      setLoading(true);
      const params = storeFilter !== 'all' ? { shop_id: storeFilter } : {};
      const data = await promotionsApi.getAll(params);
      setPromotions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load promotions:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('คุณต้องการลบโปรโมชั่นนี้หรือไม่?')) return;
    
    try {
      await promotionsApi.delete(id);
      toast.success('ลบโปรโมชั่นสำเร็จ');
      loadData();
    } catch (error) {
      console.error('Failed to delete promotion:', error);
      toast.error('ไม่สามารถลบโปรโมชั่นได้');
    }
  };

  const handleEdit = (promotion) => {
    setEditPromotion(promotion);
    setIsEditOpen(true);
  };

  const handleViewHistory = (promotionId) => {
    router.push(`/crm-customer/promotion-history?promotion_id=${promotionId}`);
  };

  const getStoreName = (shopId) => {
    const store = stores.find((s) => s.id === shopId);
    return store?.name || '-';
  };

  const getBranchNames = (branchIds) => {
    if (!branchIds || !Array.isArray(branchIds) || branchIds.length === 0) {
      return '-';
    }
    const names = branchIds.map(branchItem => {
      // If branchItem is an object, extract the id
      let branchId;
      if (typeof branchItem === 'object' && branchItem !== null) {
        branchId = branchItem.id || branchItem.branch_id;
        // If it's already an object with name, use it directly
        if (branchItem.name) {
          return branchItem.name;
        }
      } else {
        branchId = branchItem;
      }
      
      // Find branch by id
      const branch = branches.find(b => b.id === branchId);
      return branch?.name || branchId || '-';
    });
    return names.join(', ');
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      open: 'เปิด',
      close: 'ปิด',
    };
    return statusMap[status] || status;
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
        accessorKey: 'image_url',
        id: 'image_url',
        header: ({ column }) => (
          <DataGridColumnHeader title="รูปภาพ" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const imageUrl = row.original.image_url || row.original.imageURL;
          const name = row.original.name || '';
          return (
            <Avatar className="size-12">
              <AvatarImage src={imageUrl} alt={name} />
              <AvatarFallback className="border-0 text-xs font-semibold bg-primary text-white">
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          );
        },
        size: 100,
        enableSorting: false,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'name',
        id: 'name',
        header: ({ column }) => (
          <DataGridColumnHeader title="ชื่อโปรโมชั่น" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          return (
            <div className="font-medium text-foreground">
              {row.original.name || '-'}
            </div>
          );
        },
        size: 200,
        enableSorting: true,
        enableHiding: false,
        enableResizing: true,
      },
      {
        accessorKey: 'points',
        id: 'points',
        header: ({ column }) => (
          <DataGridColumnHeader title="แลกคะแนนสะสม" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const points = row.original.points || 0;
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
        accessorKey: 'shop_id',
        id: 'shop_id',
        header: ({ column }) => (
          <DataGridColumnHeader title="ร้านค้า" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const shopId = row.original.shop_id || row.original.shopID;
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
        accessorKey: 'branches',
        id: 'branches',
        header: ({ column }) => (
          <DataGridColumnHeader title="สาขา" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const branchIds = row.original.branches || row.original.branch_ids || [];
          return (
            <div className="text-foreground text-sm">
              {getBranchNames(branchIds)}
            </div>
          );
        },
        size: 250,
        enableSorting: false,
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
          const status = row.original.status || 'close';
          return (
            <Badge variant={status === 'open' ? 'default' : 'secondary'}>
              {getStatusLabel(status)}
            </Badge>
          );
        },
        size: 100,
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
                onClick={() => handleViewHistory(row.original.id)}
                className="h-8 w-8 p-0">
                <Eye className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEdit(row.original)}
                className="h-8 w-8 p-0">
                <Edit className="size-4" />
              </Button>
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
        size: 120,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
      },
    ],
    [stores, branches, userRole]
  );

  const [columnOrder, setColumnOrder] = useState(
    columns.map((column) => column.id)
  );

  const filteredData = useMemo(() => {
    let filtered = promotions;

    if (userRole === 'admin' && userStoreId) {
      filtered = filtered.filter((item) => {
        const shopId = item.shop_id || item.shopID;
        return shopId === userStoreId;
      });
    } else if (userRole === 'superadmin' && storeFilter !== 'all') {
      filtered = filtered.filter((item) => {
        const shopId = item.shop_id || item.shopID;
        return shopId === storeFilter;
      });
    }

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        const shopId = item.shop_id || item.shopID;
        return (
          (item.name || '').toLowerCase().includes(searchLower) ||
          getStoreName(shopId).toLowerCase().includes(searchLower) ||
          (item.points || 0).toString().includes(searchLower)
        );
      });
    }

    return filtered;
  }, [searchQuery, storeFilter, promotions, stores, userRole, userStoreId]);

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
      <EditPromotionSheet
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setEditPromotion(null);
          }
        }}
        promotion={editPromotion}
        stores={stores}
        branches={branches}
        onSuccess={loadData}
      />
    </>
  );
}

