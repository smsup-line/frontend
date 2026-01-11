'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Edit, Search, Settings2, Trash2 } from 'lucide-react';
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
import { packageRenewalHistoryApi, storeApi, packagesApi } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { EditPackageRenewalHistorySheet } from './edit-package-renewal-history-sheet';

export default function PackageRenewalHistoryList({ refreshKey = 0 }) {
  const [history, setHistory] = useState([]);
  const [stores, setStores] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 15,
  });
  const [sorting, setSorting] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [storeFilter, setStoreFilter] = useState('all');
  const [packageFilter, setPackageFilter] = useState('all');
  const [editHistory, setEditHistory] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    loadStores();
    loadPackages();
    loadData();
  }, []);

  useEffect(() => {
    loadData();
  }, [storeFilter, packageFilter, refreshKey]);

  const loadStores = async () => {
    try {
      const data = await storeApi.getAll();
      setStores(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load stores:', error);
    }
  };

  const loadPackages = async () => {
    try {
      const data = await packagesApi.getAll();
      setPackages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load packages:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (storeFilter !== 'all') {
        params.shop_id = storeFilter;
      }
      if (packageFilter !== 'all') {
        params.package_id = packageFilter;
      }
      const data = await packageRenewalHistoryApi.getAll(params);
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to load package renewal history:', error);
      toast.error('ไม่สามารถโหลดข้อมูลได้');
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('คุณต้องการลบประวัติการต่ออายุนี้หรือไม่?')) return;
    
    try {
      await packageRenewalHistoryApi.delete(id);
      toast.success('ลบประวัติการต่ออายุสำเร็จ');
      loadData();
    } catch (error) {
      console.error('Failed to delete package renewal history:', error);
      toast.error('ไม่สามารถลบประวัติการต่ออายุได้');
    }
  };

  const handleEdit = (item) => {
    setEditHistory(item);
    setIsEditOpen(true);
  };

  const getStoreName = (shopId) => {
    const store = stores.find((s) => s.id === shopId);
    return store?.name || '-';
  };

  const getPackageName = (packageId) => {
    const pkg = packages.find((p) => p.id === packageId);
    return pkg?.name || '-';
  };

  const formatPrice = (price) => {
    if (price === 0 || price === null || price === undefined) {
      return 'Free';
    }
    return `฿${price.toLocaleString()}`;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    try {
      return format(new Date(date), 'dd/MM/yyyy');
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
        accessorKey: 'shop_id',
        id: 'shop_id',
        header: ({ column }) => (
          <DataGridColumnHeader title="ร้านค้า" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const shopId = row.original.shop_id || row.original.shopId;
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
        accessorKey: 'package_id',
        id: 'package_id',
        header: ({ column }) => (
          <DataGridColumnHeader title="แพ็คเกจ" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const packageId = row.original.package_id || row.original.packageId;
          return (
            <div className="text-foreground">
              {getPackageName(packageId)}
            </div>
          );
        },
        size: 200,
        enableSorting: true,
        enableHiding: true,
        enableResizing: true,
      },
      {
        accessorKey: 'price',
        id: 'price',
        header: ({ column }) => (
          <DataGridColumnHeader title="ราคา" visibility={true} column={column} />
        ),
        cell: ({ row }) => {
          const price = row.original.price || 0;
          return (
            <div className="text-foreground font-semibold">
              {formatPrice(price)}
            </div>
          );
        },
        size: 120,
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
    [stores, packages]
  );

  const [columnOrder, setColumnOrder] = useState(
    columns.map((column) => column.id)
  );

  const filteredData = useMemo(() => {
    let filtered = history;

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((item) => {
        const shopId = item.shop_id || item.shopId;
        const packageId = item.package_id || item.packageId;
        const storeName = getStoreName(shopId);
        const packageName = getPackageName(packageId);
        return (
          storeName.toLowerCase().includes(searchLower) ||
          packageName.toLowerCase().includes(searchLower) ||
          (item.price?.toString() || '').includes(searchLower)
        );
      });
    }

    return filtered;
  }, [searchQuery, history, stores, packages]);

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
                <Select value={packageFilter} onValueChange={setPackageFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="กรองตามแพ็คเกจ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {packages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name}
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
      <EditPackageRenewalHistorySheet
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        history={editHistory}
        onSuccess={loadData}
      />
    </>
  );
}


