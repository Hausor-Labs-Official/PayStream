'use client';

import { PanelLeft, User, ChevronDown, Settings, LogOut, UserCircle } from 'lucide-react';
import { useUser, useClerk } from '@clerk/nextjs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import WalletConnect from '@/components/wallet/WalletConnect';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface TopbarProps {
  onToggleSidebar?: () => void;
}

export default function Topbar({ onToggleSidebar }: TopbarProps) {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="h-16 bg-white border-b border-gray-200 sticky top-0 z-50 px-6">
      <div className="h-full flex items-center justify-between gap-4">
        {/* Left side - Sidebar toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar"
        >
          <PanelLeft className="w-5 h-5" />
        </Button>

        {/* Right side - Wallet Connect & User Profile */}
        <div className="flex items-center gap-3">
          <WalletConnect />
          {isLoaded && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="gap-2 h-10 px-3 hover:bg-gray-100 transition-colors"
                >
                  <Avatar className="w-8 h-8 ring-2 ring-gray-200">
                    <AvatarImage src={user.imageUrl} alt={user.fullName || 'User'} />
                    <AvatarFallback className="bg-[#0044FF] text-white text-sm font-semibold">
                      {user.firstName?.[0]}{user.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:flex flex-col items-start">
                    <span className="text-sm font-medium leading-none">
                      {user.firstName || 'User'}
                    </span>
                    <span className="text-xs text-muted-foreground leading-none mt-1">
                      {user.primaryEmailAddress?.emailAddress?.split('@')[0]}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10 ring-2 ring-gray-200">
                      <AvatarImage src={user.imageUrl} alt={user.fullName || 'User'} />
                      <AvatarFallback className="bg-[#0044FF] text-white font-semibold">
                        {user.firstName?.[0]}{user.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none">
                        {user.fullName || 'User'}
                      </p>
                      <p className="text-xs text-muted-foreground leading-none">
                        {user.primaryEmailAddress?.emailAddress}
                      </p>
                    </div>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="cursor-pointer">
                  <UserCircle className="w-4 h-4 mr-2 text-gray-600" />
                  <span>View Profile</span>
                </DropdownMenuItem>

                <DropdownMenuItem className="cursor-pointer">
                  <Settings className="w-4 h-4 mr-2 text-gray-600" />
                  <span>Account Settings</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-muted">
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
