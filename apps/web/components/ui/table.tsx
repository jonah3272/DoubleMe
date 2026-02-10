"use client";

import { forwardRef } from "react";

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "var(--text-sm)",
};

const thStyle: React.CSSProperties = {
  padding: "var(--space-3) var(--space-4)",
  textAlign: "left",
  fontWeight: "var(--font-medium)",
  color: "var(--color-text-muted)",
  borderBottom: "1px solid var(--color-border)",
};

const tdStyle: React.CSSProperties = {
  padding: "var(--space-3) var(--space-4)",
  borderBottom: "1px solid var(--color-border-subtle)",
};

export const Table = forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className = "", style, ...props }, ref) => (
  <table
    ref={ref}
    className={className}
    style={{ ...tableStyle, ...style }}
    {...props}
  />
));

Table.displayName = "Table";

export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className = "", style, ...props }, ref) => (
  <thead ref={ref} className={className} style={style} {...props} />
));

TableHeader.displayName = "TableHeader";

export const TableBody = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className = "", style, ...props }, ref) => (
  <tbody ref={ref} className={className} style={style} {...props} />
));

TableBody.displayName = "TableBody";

export const TableRow = forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className = "", style, ...props }, ref) => (
  <tr ref={ref} className={className} style={style} {...props} />
));

TableRow.displayName = "TableRow";

export const TableHead = forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className = "", style, ...props }, ref) => (
  <th
    ref={ref}
    className={className}
    style={{ ...thStyle, ...style }}
    {...props}
  />
));

TableHead.displayName = "TableHead";

export const TableCell = forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className = "", style, ...props }, ref) => (
  <td
    ref={ref}
    className={className}
    style={{ ...tdStyle, ...style }}
    {...props}
  />
));

TableCell.displayName = "TableCell";
