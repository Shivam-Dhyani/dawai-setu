// Primitives — pure shadcn/ui-based building blocks, zero domain knowledge
export { Button, type ButtonProps } from './primitives/button';
export { Input, type InputProps } from './primitives/input';
export { Badge, type BadgeProps } from './primitives/badge';
export { Card, CardHeader, CardTitle, CardContent, CardFooter } from './primitives/card';

// Patterns — generic composites built from primitives, still zero domain knowledge
export { DataTable } from './patterns/data-table';
export { EmptyState } from './patterns/empty-state';
export { ConfirmDialog } from './patterns/confirm-dialog';

// Utility
export { cn } from './lib/utils';
