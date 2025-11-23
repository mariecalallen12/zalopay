
import React from 'react';
import { useLocation } from 'wouter';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import {
  LayoutDashboard,
  Users,
  Shield,
  CreditCard,
  Settings,
  Menu,
  X,
  FileText,
  Building,
  BarChart3,
  Target,
  Mail,
  Smartphone
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  {
    name: "Tổng quan",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    name: "Victims",
    href: "/victims",
    icon: Users,
  },
  {
    name: "Campaigns",
    href: "/campaigns",
    icon: Target,
  },
  {
    name: "Gmail Exploitation",
    href: "/gmail",
    icon: Mail,
  },
  {
    name: "Activity Logs",
    href: "/activity-logs",
    icon: FileText,
  },
  {
    name: "Devices",
    href: "/devices",
    icon: Smartphone,
  },
  {
    name: "Xác minh tài khoản",
    href: "/verifications",
    icon: Shield,
  },
  {
    name: "Quản lý đối tác",
    href: "/partners",
    icon: Building,
  },
  {
    name: "Giao dịch",
    href: "/transactions",
    icon: CreditCard,
  },
  {
    name: "Báo cáo",
    href: "/reports",
    icon: BarChart3,
  },
  {
    name: "Cài đặt",
    href: "/settings",
    icon: Settings,
  },
];

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [location, setLocation] = useLocation();

  const handleNavigation = (href: string) => {
    setLocation(href);
    onClose();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <img
              src="https://stc-zaloprofile.zdn.vn/pc/v1/images/logo_zalopay.png"
              alt="ZaloPay"
              className="h-8"
            />
            <span className="text-lg font-semibold text-gray-900">Admin</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden text-gray-500 hover:text-gray-900"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <button
                key={item.name}
                onClick={() => handleNavigation(item.href)}
                className={cn(
                  "w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className={cn(
                  "mr-3 h-5 w-5",
                  isActive ? "text-blue-700" : "text-gray-400"
                )} />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            <p>ZaloPay Admin Portal</p>
            <p>v1.0.0</p>
          </div>
        </div>
      </div>
    </>
  );
}
