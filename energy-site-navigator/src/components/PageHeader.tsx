
import { FC, ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: ReactNode;
}

const PageHeader: FC<PageHeaderProps> = ({ title, description, icon }) => {
  return (
    <div className="flex flex-col space-y-4 p-4 lg:p-8 mb-6 bg-gradient-to-r from-orange-50 to-blue-50 rounded-lg">
      <div className="flex items-center space-x-3">
        {icon && <div className="text-primary">{icon}</div>}
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      </div>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default PageHeader;
