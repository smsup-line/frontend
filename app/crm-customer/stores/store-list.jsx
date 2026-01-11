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
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { storeApi, packagesApi } from '@/lib/api';
import { toast } from 'sonner';
import { NewStoreSheet } from './new-store-sheet';
import { EditStoreSheet } from './edit-store-sheet';
import { format } from 'date-fns';

export default function StoreList() {
  const [stores, setStores] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
  });
  const [sorting, setSorting] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editStore, setEditStore] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    loadStores();
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const data = await packagesApi.getAll();
      setPackages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load packages:', error);
    }
  };

  const loadStores = async () => {
    try {
      setLoading(true);
      const data = await storeApi.getAll();
      setStores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load stores:', error);
      toast.error('ไม่สามารถโหลดข้อมูลร้านค้าได้');
      setStores([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('คุณต้องการลบร้านค้านี้หรือไม่?')) return;
    
    try {
      await storeApi.delete(id);
      toast.success('ลบร้านค้าสำเร็จ');
      loadStores();
    } catch (error) {
      console.error('Failed to delete store:', error);
      toast.error('ไม่สามารถลบร้านค้าได้');
    }
  };

  const handleEdit = (store) => {
    setEditStore(store);
    setIsEditOpen(true);
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
        accessorKey: 'logo',
        id: 'logo',
        header: ({ column }) => (
          <DataGridColumnHeader title="โลโก้" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const logo = row.original.logo_url || row.original.logo;
          const name = row.original.name || '';
          return (
            <Avatar className="size-8">
              <AvatarImage src={logo} alt={name} />
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
          <DataGridColumnHeader title="ชื่อร้านค้า" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          return (
            <div className="font-medium text-foreground">
              {row.original.name}
            </div>
          );
        },
        size: 200,
        enableSorting: true,
        enableHiding: false,
        enableResizing: true,
      },
      {
        accessorKey: 'address',
        id: 'address',
        header: ({ column }) => (
          <DataGridColumnHeader title="ที่อยู่" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          return (
            <div className="truncate max-w-[300px]">
              {row.original.address || '-'}
            </div>
          );
        },
        size: 300,
        enableSorting: true,
        enableHiding: true,
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
        accessorKey: 'description',
        id: 'description',
        header: ({ column }) => (
          <DataGridColumnHeader title="รายละเอียด" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          return (
            <div className="truncate max-w-[300px]">
              {row.original.description || '-'}
            </div>
          );
        },
        size: 300,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'package_id',
        id: 'package_id',
        header: ({ column }) => (
          <DataGridColumnHeader title="แพ็คเกจ" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const packageId = row.original.package_id || row.original.packageId;
          const pkg = packages.find((p) => p.id === packageId);
          return (
            <div className="text-foreground">
              {pkg?.name || '-'}
            </div>
          );
        },
        size: 150,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'start_date',
        id: 'start_date',
        header: ({ column }) => (
          <DataGridColumnHeader title="วันเริ่มต้น" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const startDate = row.original.start_date || row.original.startDate;
          if (!startDate) return '-';
          try {
            return format(new Date(startDate), 'dd/MM/yyyy');
          } catch {
            return startDate;
          }
        },
        size: 120,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'end_date',
        id: 'end_date',
        header: ({ column }) => (
          <DataGridColumnHeader title="วันสิ้นสุด" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const endDate = row.original.end_date || row.original.endDate;
          if (!endDate) return '-';
          try {
            return format(new Date(endDate), 'dd/MM/yyyy');
          } catch {
            return endDate;
          }
        },
        size: 120,
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
          return (
            <div className="text-foreground">
              {status === 'open' ? 'เปิด' : status === 'close' ? 'ปิด' : status || '-'}
            </div>
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
    [packages]
  );

  const [columnOrder, setColumnOrder] = useState(
    columns.map((column) => column.id)
  );

  const filteredData = useMemo(() => {
    if (!searchQuery) return stores;
    
    const searchLower = searchQuery.toLowerCase();
    return stores.filter((item) => {
      return (
        (item.name || '').toLowerCase().includes(searchLower) ||
        (item.address || '').toLowerCase().includes(searchLower) ||
        (item.phone || '').toLowerCase().includes(searchLower) ||
        (item.description || '').toLowerCase().includes(searchLower)
      );
    });
  }, [searchQuery, stores]);

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
      {editStore && (
        <EditStoreSheet
          open={isEditOpen}
          onOpenChange={(open) => {
            setIsEditOpen(open);
            if (!open) {
              setEditStore(null);
            }
          }}
          store={editStore}
          onSuccess={loadStores}
        />
      )}
    </>
  );
}

