"use client";

import * as React from "react";
import { z } from "zod";
import {
    ColumnDef,
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    getFilteredRowModel,
    flexRender,
} from "@tanstack/react-table";
import { IconCircleCheckFilled, IconLoader } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

// Zod Schemas for each role
const studentCourseSchema = z.object({
    id: z.number(),
    courseTitle: z.string(),
    progress: z.number(),
    enrolledAt: z.string(),
    status: z.string().optional(),
});

const adminEnrollmentSchema = z.object({
    id: z.number(),
    studentEmail: z.string(),
    courseTitle: z.string(),
    revenue: z.number(),
    enrolledAt: z.string(),
});

const teacherCourseSchema = z.object({
    id: z.number(),
    courseTitle: z.string(),
    enrollments: z.number(),
    averageProgress: z.number(),
    createdAt: z.string(),
});

// Column Definitions for each role
const studentColumns: ColumnDef<z.infer<typeof studentCourseSchema>>[] = [
    {
        accessorKey: "courseTitle",
        header: "Course Title",
        cell: ({ row }) => <div>{row.original.courseTitle}</div>,
    },
    {
        accessorKey: "progress",
        header: "Progress",
        cell: ({ row }) => <div>{row.original.progress.toFixed(2)}%</div>,
    },
    {
        accessorKey: "enrolledAt",
        header: "Enrolled On",
        cell: ({ row }) => (
            <div>{new Date(row.original.enrolledAt).toLocaleDateString()}</div>
        ),
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
            <Badge variant="outline">
                {row.original.progress === 100 ? (
                    <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400 mr-1" />
                ) : (
                    <IconLoader className="mr-1" />
                )}
                {row.original.progress === 100 ? "Completed" : "In Progress"}
            </Badge>
        ),
    },
];

const adminColumns: ColumnDef<z.infer<typeof adminEnrollmentSchema>>[] = [
    {
        accessorKey: "studentEmail",
        header: "Student Email",
        cell: ({ row }) => <div>{row.original.studentEmail}</div>,
    },
    {
        accessorKey: "courseTitle",
        header: "Course Title",
        cell: ({ row }) => <div>{row.original.courseTitle}</div>,
    },
    {
        accessorKey: "revenue",
        header: "Revenue",
        cell: ({ row }) => <div>${row.original.revenue.toFixed(2)}</div>,
    },
    {
        accessorKey: "enrolledAt",
        header: "Enrolled On",
        cell: ({ row }) => (
            <div>{new Date(row.original.enrolledAt).toLocaleDateString()}</div>
        ),
    },
];

const teacherColumns: ColumnDef<z.infer<typeof teacherCourseSchema>>[] = [
    {
        accessorKey: "courseTitle",
        header: "Course Title",
        cell: ({ row }) => <div>{row.original.courseTitle}</div>,
    },
    {
        accessorKey: "enrollments",
        header: "Enrollments",
        cell: ({ row }) => <div>{row.original.enrollments}</div>,
    },
    {
        accessorKey: "averageProgress",
        header: "Avg. Progress",
        cell: ({ row }) => <div>{row.original.averageProgress.toFixed(2)}%</div>,
    },
    {
        accessorKey: "createdAt",
        header: "Created On",
        cell: ({ row }) => (
            <div>{new Date(row.original.createdAt).toLocaleDateString()}</div>
        ),
    },
];

// Role-Based Data Table Component
interface RoleBasedDataTableProps {
    role: "student" | "admin" | "teacher";
    data: any[];
}

export function RoleBasedDataTable({ role, data }: RoleBasedDataTableProps) {
    const columns =
        role === "student"
            ? studentColumns
            : role === "admin"
                ? adminColumns
                : teacherColumns;

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        initialState: { pagination: { pageSize: 5 } },
    });

    return (
        <div className="rounded-lg border">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                    {flexRender(header.column.columnDef.header, header.getContext())}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow key={row.id}>
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                No data available.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <div className="flex items-center justify-between p-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                >
                    Previous
                </Button>
                <span>
                    Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                >
                    Next
                </Button>
            </div>
        </div>
    );
}
