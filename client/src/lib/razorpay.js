const CHECKOUT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

let loaderPromise = null;

/**
 * Lazily injects the Razorpay Checkout script and resolves with the global
 * `Razorpay` constructor — or `null` if the script fails to load (offline).
 */
export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = CHECKOUT_SRC;
    script.async = true;
    script.onload = () => resolve(window.Razorpay || null);
    script.onerror = () => {
      loaderPromise = null;
      resolve(null);
    };
    document.body.appendChild(script);
  });
  return loaderPromise;
}
