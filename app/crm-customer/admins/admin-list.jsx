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
import { adminApi, storeApi } from '@/lib/api';
import { toast } from 'sonner';
import { EditAdminSheet } from './edit-admin-sheet';

export default function AdminList() {
  const [admins, setAdmins] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
  });
  const [sorting, setSorting] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [editAdmin, setEditAdmin] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [adminsData, storesData] = await Promise.all([
        adminApi.getAll(),
        storeApi.getAll(),
      ]);
      setAdmins(Array.isArray(adminsData) ? adminsData : []);
      setStores(Array.isArray(storesData) ? storesData : []);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
      setAdmins([]);
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('คุณต้องการลบผู้ดูแลระบบนี้หรือไม่?')) return;
    
    try {
      await adminApi.delete(id);
      toast.success('ลบผู้ดูแลระบบสำเร็จ');
      loadData();
    } catch (error) {
      console.error('Failed to delete admin:', error);
      toast.error('ไม่สามารถลบผู้ดูแลระบบได้');
    }
  };

  const handleEdit = (admin) => {
    setEditAdmin(admin);
    setIsEditOpen(true);
  };

  const getStoreName = (storeId) => {
    const store = stores.find((s) => s.id === storeId);
    return store?.name || '-';
  };

  const getRoleLabel = (role) => {
    const roles = {
      superadmin: 'Super Admin',
      admin: 'Admin',
    };
    return roles[role] || role;
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
        accessorKey: 'first_name',
        id: 'first_name',
        header: ({ column }) => (
          <DataGridColumnHeader title="ชื่อ" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const firstName = row.original.first_name || row.original.firstName;
          return (
            <div className="font-medium text-foreground">
              {firstName || '-'}
            </div>
          );
        },
        size: 150,
        enableSorting: true,
        enableHiding: false,
        enableResizing: true,
      },
      {
        accessorKey: 'last_name',
        id: 'last_name',
        header: ({ column }) => (
          <DataGridColumnHeader title="นามสกุล" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const lastName = row.original.last_name || row.original.lastName;
          return (
            <div className="text-foreground">
              {lastName || '-'}
            </div>
          );
        },
        size: 150,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'username',
        id: 'username',
        header: ({ column }) => (
          <DataGridColumnHeader title="Username" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          return (
            <div className="text-foreground">
              {row.original.username || '-'}
            </div>
          );
        },
        size: 150,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'level',
        id: 'level',
        header: ({ column }) => (
          <DataGridColumnHeader title="ระดับผู้ดูแลระบบ" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const level = row.original.level || row.original.role;
          return (
            <div className="text-foreground">
              {getRoleLabel(level)}
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
    [stores]
  );

  const [columnOrder, setColumnOrder] = useState(
    columns.map((column) => column.id)
  );

  const filteredData = useMemo(() => {
    let filtered = admins;

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter((item) => {
        const level = item.level || item.role;
        return level === roleFilter;
      });
    }

    // Filter by search query
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        const firstName = item.first_name || item.firstName || '';
        const lastName = item.last_name || item.lastName || '';
        const level = item.level || item.role || '';
        const shopId = item.shop_id || item.storeId;
        const storeName = getStoreName(shopId);
        return (
          firstName.toLowerCase().includes(searchLower) ||
          lastName.toLowerCase().includes(searchLower) ||
          (item.username || '').toLowerCase().includes(searchLower) ||
          level.toLowerCase().includes(searchLower) ||
          storeName.toLowerCase().includes(searchLower)
        );
      });
    }

    return filtered;
  }, [searchQuery, roleFilter, admins, stores]);

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
                    <SelectItem value="superadmin">Super Admin</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
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
      {editAdmin && (
        <EditAdminSheet
          open={isEditOpen}
          onOpenChange={(open) => {
            setIsEditOpen(open);
            if (!open) {
              setEditAdmin(null);
            }
          }}
          admin={editAdmin}
          stores={stores}
          onSuccess={loadData}
        />
      )}
    </>
  );
}

