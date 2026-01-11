'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Edit, Search, Settings2, Trash2, X } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { customerApi, storeApi, branchApi } from '@/lib/api';
import { toast } from 'sonner';
import { EditCustomerSheet } from './edit-customer-sheet';
import { format } from 'date-fns';

export default function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [stores, setStores] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [userStoreId, setUserStoreId] = useState(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
  });
  const [sorting, setSorting] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [storeFilter, setStoreFilter] = useState('all');
  const [editCustomer, setEditCustomer] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    loadUserInfo();
    loadData();
  }, []);

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
      const [customersData, storesData, branchesData] = await Promise.all([
        customerApi.getAll(),
        storeApi.getAll(),
        branchApi.getAll(),
      ]);
      const customersArray = Array.isArray(customersData) ? customersData : [];
      const storesArray = Array.isArray(storesData) ? storesData : [];
      const branchesArray = Array.isArray(branchesData) ? branchesData : [];
      
      console.log('Loaded customers:', customersArray);
      console.log('Loaded stores:', storesArray);
      console.log('Loaded branches:', branchesArray);
      
      // If total_points is not in getAll response, fetch it for each customer
      const customersWithPoints = await Promise.all(
        customersArray.map(async (customer) => {
          // Check if total_points already exists
          if (customer.total_points !== undefined && customer.total_points !== null) {
            return customer;
          }
          
          // Try to get total_points from getById
          try {
            const customerDetail = await customerApi.getById(customer.id);
            return {
              ...customer,
              total_points: customerDetail?.total_points ?? customerDetail?.totalPoints ?? 0,
            };
          } catch (error) {
            console.error(`Failed to load total_points for customer ${customer.id}:`, error);
            return {
              ...customer,
              total_points: 0,
            };
          }
        })
      );
      
      setCustomers(customersWithPoints);
      setStores(storesArray);
      setBranches(branchesArray);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
      setCustomers([]);
      setStores([]);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('คุณต้องการลบลุกค้านี้หรือไม่?')) return;
    
    try {
      await customerApi.delete(id);
      toast.success('ลบลุกค้าสำเร็จ');
      loadData();
    } catch (error) {
      console.error('Failed to delete customer:', error);
      toast.error('ไม่สามารถลบลุกค้าได้');
    }
  };

  const handleEdit = (customer) => {
    setEditCustomer(customer);
    setIsEditOpen(true);
  };

  const getStoreName = (shopId) => {
    if (!shopId) return '-';
    const store = stores.find((s) => s.id === shopId);
    if (!store) {
      console.warn('Store not found for shopId:', shopId, 'Available stores:', stores.map(s => s.id));
    }
    return store?.name || '-';
  };

  const getBranchName = (branchId) => {
    if (!branchId) return '-';
    const branch = branches.find((b) => b.id === branchId);
    return branch?.name || '-';
  };

  const getRoleLabel = (role) => {
    const roles = {
      adminshop: 'Staff ร้าน',
      customer: 'ลูกค้าร้าน',
    };
    return roles[role] || role;
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
        accessorKey: 'avatar',
        id: 'avatar',
        header: ({ column }) => (
          <DataGridColumnHeader title="รูปภาพ" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const avatar = row.original.avatar_url || row.original.avatar;
          const name = row.original.name || '';
          return (
            <Avatar className="size-8">
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback className="border-0 text-xs font-semibold bg-primary text-white">
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          );
        },
        size: 80,
        enableSorting: false,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'name',
        id: 'name',
        header: ({ column }) => (
          <DataGridColumnHeader title="ชื่อ" visibility={true} column={column} />
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
        accessorKey: 'phone',
        id: 'phone',
        header: ({ column }) => (
          <DataGridColumnHeader title="เบอร์โทรศัพท์" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          return (
            <div className="text-foreground">
              {row.original.phone || '-'}
            </div>
          );
        },
        size: 150,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'role',
        id: 'role',
        header: ({ column }) => (
          <DataGridColumnHeader title="Role" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          return (
            <div className="text-foreground">
              {getRoleLabel(row.original.role)}
            </div>
          );
        },
        size: 150,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'otp_verify',
        id: 'otp_verify',
        header: ({ column }) => (
          <DataGridColumnHeader title="OTP Verify" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const otpVerify = row.original.otp_verify ?? row.original.otpVerify ?? false;
          return (
            <div className="text-foreground">
              {otpVerify ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน'}
            </div>
          );
        },
        size: 120,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'line_token',
        id: 'line_token',
        header: ({ column }) => (
          <DataGridColumnHeader title="Line Token" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const lineToken = row.original.line_token || row.original.lineToken;
          return (
            <div className="truncate max-w-[200px] text-foreground">
              {lineToken || '-'}
            </div>
          );
        },
        size: 200,
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
          const shopId = row.original.shop_id || row.original.storeId || row.original.store_id || row.original.shopId;
          const storeName = getStoreName(shopId);
          if (!storeName || storeName === '-') {
            console.warn('Store name not found for customer:', {
              customerId: row.original.id,
              customerName: row.original.name,
              shopId: shopId,
              availableStores: stores.map(s => ({ id: s.id, name: s.name })),
              customerShopId: row.original.shop_id,
              customerStoreId: row.original.storeId,
            });
          }
          return (
            <div className="text-foreground">
              {storeName}
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
          <DataGridColumnHeader title="รหัสสาขา" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const branchId = row.original.branch_id || row.original.branchId;
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
        accessorKey: 'last_checkin_at',
        id: 'last_checkin_at',
        header: ({ column }) => (
          <DataGridColumnHeader title="เวลาเช็คอินล่าสุด" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const lastCheckin = row.original.last_checkin_at || row.original.lastCheckinAt || row.original.lastCheckIn;
          return (
            <div className="text-foreground">
              {formatDate(lastCheckin)}
            </div>
          );
        },
        size: 200,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'total_points',
        id: 'total_points',
        header: ({ column }) => (
          <DataGridColumnHeader title="คะแนนสะสม" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const totalPoints = row.original.total_points ?? row.original.totalPoints ?? 0;
          console.log('Customer total_points:', row.original.id, totalPoints, row.original);
          return (
            <div className="text-foreground font-semibold">
              {typeof totalPoints === 'number' ? totalPoints.toLocaleString() : '0'}
            </div>
          );
        },
        size: 150,
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
        size: 100,
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
    let filtered = customers;

    // Filter by store (for admin role, only show their store)
    if (userRole === 'admin' && userStoreId) {
      filtered = filtered.filter((item) => {
        const shopId = item.shop_id || item.storeId;
        return shopId === userStoreId;
      });
    } else if (userRole === 'superadmin' && storeFilter !== 'all') {
      filtered = filtered.filter((item) => {
        const shopId = item.shop_id || item.storeId;
        return shopId === storeFilter;
      });
    }

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter((item) => item.role === roleFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        const shopId = item.shop_id || item.storeId;
        const branchId = item.branch_id || item.branchId;
        return (
          (item.name || '').toLowerCase().includes(searchLower) ||
          (item.phone || '').toLowerCase().includes(searchLower) ||
          (item.role || '').toLowerCase().includes(searchLower) ||
          (item.otp_verify !== undefined ? (item.otp_verify ? 'ยืนยันแล้ว' : 'ยังไม่ยืนยัน') : '').toLowerCase().includes(searchLower) ||
          (item.line_token || item.lineToken || '').toLowerCase().includes(searchLower) ||
          getStoreName(shopId).toLowerCase().includes(searchLower) ||
          getBranchName(branchId).toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  }, [searchQuery, roleFilter, storeFilter, customers, userRole, userStoreId]);

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
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="กรองตาม Role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="adminshop">Staff ร้าน</SelectItem>
                    <SelectItem value="customer">ลูกค้าร้าน</SelectItem>
                  </SelectContent>
                </Select>
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
      {editCustomer && (
        <EditCustomerSheet
          open={isEditOpen}
          onOpenChange={(open) => {
            setIsEditOpen(open);
            if (!open) {
              setEditCustomer(null);
            }
          }}
          customer={editCustomer}
          onSuccess={loadData}
        />
      )}
    </>
  );
}

