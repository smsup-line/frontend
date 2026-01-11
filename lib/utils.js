import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind class names, resolving any conflicts.
 *
 * @param inputs - An array of class names to merge.
 * @returns A string of merged and optimized class names.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Get shop_id from localStorage or user object
 * Priority: localStorage.shop_id > user.shop_id > user.shop?.id
 * 
 * @returns {string|null} shop_id or null if not found
 */
export function getShopId() {
  if (typeof window === 'undefined') return null;
  
  // First, try to get from localStorage directly
  const shopIdFromStorage = localStorage.getItem('shop_id');
  if (shopIdFromStorage && shopIdFromStorage !== 'null' && shopIdFromStorage !== 'undefined') {
    return shopIdFromStorage;
  }
  
  // Second, try to get from user object
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const shopId = user.shop_id || user.shop?.id || user.storeId || user.store_id || user.shopId;
      if (shopId && shopId !== 'null' && shopId !== 'undefined') {
        return shopId;
      }
    }
  } catch (error) {
    console.error('Error parsing user data:', error);
  }
  
  return null;
}

/**
 * Get branch_id from localStorage or user object
 * Priority: localStorage.branch_id > user.branch_id > user.branch?.id
 * 
 * @returns {string|null} branch_id or null if not found
 */
export function getBranchId() {
  if (typeof window === 'undefined') return null;
  
  // First, try to get from localStorage directly
  const branchIdFromStorage = localStorage.getItem('branch_id');
  if (branchIdFromStorage && branchIdFromStorage !== 'null' && branchIdFromStorage !== 'undefined') {
    return branchIdFromStorage;
  }
  
  // Second, try to get from user object
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const branchId = user.branch_id || user.branch?.id || user.branchId;
      if (branchId && branchId !== 'null' && branchId !== 'undefined') {
        return branchId;
      }
    }
  } catch (error) {
    console.error('Error parsing user data:', error);
  }
  
  return null;
}

/**
 * Get both shop_id and branch_id
 * 
 * @returns {{shop_id: string|null, branch_id: string|null}} Object with shop_id and branch_id
 */
export function getShopAndBranch() {
  return {
    shop_id: getShopId(),
    branch_id: getBranchId(),
  };
}