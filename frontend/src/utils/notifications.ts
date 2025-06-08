const { ipcRenderer } = window.require('electron');

export const showNotification = (title: string, body: string) => {
  ipcRenderer.send('show-notification', { title, body });
};

export const notifyNewItem = (itemName: string, price: string) => {
  showNotification(
    'New Item Found!',
    `${itemName} - ${price}`
  );
};

export const notifyPriceChange = (itemName: string, oldPrice: string, newPrice: string) => {
  showNotification(
    'Price Change Detected',
    `${itemName}: ${oldPrice} → ${newPrice}`
  );
}; 