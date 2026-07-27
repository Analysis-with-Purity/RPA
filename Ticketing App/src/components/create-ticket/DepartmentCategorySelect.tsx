"use client";

import { useCategories, useDepartments } from "@/lib/query/useMeta";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

interface DepartmentCategorySelectProps {
  categoryId: string;
  departmentId: string;
  onCategoryChange: (categoryId: string) => void;
  onDepartmentChange: (departmentId: string) => void;
}

export function DepartmentCategorySelect({
  categoryId,
  departmentId,
  onCategoryChange,
  onDepartmentChange,
}: DepartmentCategorySelectProps) {
  const categoriesQuery = useCategories();
  const departmentsQuery = useDepartments();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <p className="text-sm font-medium">Category</p>
        {categoriesQuery.isLoading ? (
          <Skeleton className="h-9 w-full" />
        ) : (
          <Select value={categoryId} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a category" />
            </SelectTrigger>
            <SelectContent>
              {categoriesQuery.data?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Department</p>
        {departmentsQuery.isLoading ? (
          <Skeleton className="h-9 w-full" />
        ) : (
          <Select value={departmentId} onValueChange={onDepartmentChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a department" />
            </SelectTrigger>
            <SelectContent>
              {departmentsQuery.data?.map((department) => (
                <SelectItem key={department.id} value={department.id}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
