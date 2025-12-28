'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isAuthenticated, signOut } from '@/lib/cognito';
import { FiHome, FiSearch, FiSettings, FiLogIn, FiLogOut, FiMenu, FiX, FiZap } from 'react-icons/fi';

export function Navigation(): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      const authenticated = await isAuthenticated();
      setIsLoggedIn(authenticated);
      setLoading(false);
    };
    checkAuth();
  }, [pathname]); // pathnameが変わった時に再チェック

  const handleSignOut = (): void => {
    signOut();
    setIsLoggedIn(false);
    router.push('/');
    setMobileMenuOpen(false);
  };

  const navItems = [
    { href: '/', label: 'ホーム', icon: FiHome },
    { href: '/events', label: 'イベント検索', icon: FiSearch },
  ];

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-lg sticky top-0 z-50 border-b border-gray-200">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="p-2 bg-gradient-to-br from-primary-500 to-purple-500 rounded-xl shadow-lg group-hover:shadow-xl transition-all duration-200 transform group-hover:scale-105">
              <FiZap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                Tokai Kids Events
              </span>
              <p className="text-xs text-gray-500">家族で楽しむイベント検索</p>
            </div>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-primary-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            
            {!loading && (
              <>
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/settings"
                      className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                        pathname === '/settings'
                          ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-primary-600'
                      }`}
                    >
                      <FiSettings className="w-4 h-4" />
                      <span>設定</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all duration-200"
                    >
                      <FiLogOut className="w-4 h-4" />
                      <span>ログアウト</span>
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-primary-500 to-purple-500 hover:from-primary-600 hover:to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    <FiLogIn className="w-4 h-4" />
                    <span>ログイン</span>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 animate-fade-in">
            <div className="flex flex-col space-y-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              
              {!loading && (
                <>
                  {isLoggedIn ? (
                    <>
                      <Link
                        href="/settings"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                          pathname === '/settings'
                            ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <FiSettings className="w-5 h-5" />
                        <span>設定</span>
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-all duration-200"
                      >
                        <FiLogOut className="w-5 h-5" />
                        <span>ログアウト</span>
                      </button>
                    </>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white font-semibold rounded-xl shadow-lg"
                    >
                      <FiLogIn className="w-5 h-5" />
                      <span>ログイン</span>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

