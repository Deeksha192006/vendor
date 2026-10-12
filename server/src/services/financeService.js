import { Order } from '../models/Order.js';
import { platformCommissionService } from './platformCommissionService.js';

export const financeService = {
  /**
   * Processes the financial allocation for a master order using the fixed 5% platform commission system.
   */
  async allocateOrderFinances(orderId, sessionArg = null) {
    await platformCommissionService.recordOrderCommission(orderId, sessionArg);
    const order = await Order.findById(orderId);
    if (order && order.orderStatus === 'DELIVERED') {
      await platformCommissionService.onOrderDelivered(orderId, sessionArg);
    }
  },
};
