/**
 * GA4 Analytics Tracking Utility
 * Implements Google Analytics 4 e-commerce tracking events via dataLayer
 */

export const initGA4 = () => {
    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    window.gtag = gtag;
    gtag('js', new Date());
    // In production, configure GA4 measurement id in .env
    const GA_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID || 'G-XXXXXXXXXX';
    gtag('config', GA_ID);
};

export const trackPageView = (path) => {
    if (!window.gtag) return;
    window.gtag('event', 'page_view', {
        page_path: path
    });
};

export const trackSearch = (search_term) => {
    if (!window.gtag) return;
    window.gtag('event', 'search', {
        search_term
    });
};

export const trackViewItem = (item) => {
    if (!window.gtag) return;
    window.gtag('event', 'view_item', {
        currency: 'USD',
        value: Number(item.final_price),
        items: [{
            item_id: item.product_id || item.id,
            item_name: item.title,
            item_category: item.category,
            price: Number(item.final_price)
        }]
    });
};

export const trackClickRecommendation = (item, listName) => {
    if (!window.gtag) return;
    window.gtag('event', 'select_item', {
        item_list_name: listName,
        items: [{
            item_id: item.product_id || item.id,
            item_name: item.title,
            item_category: item.category,
            price: Number(item.final_price)
        }]
    });
};

export const trackViewItemList = (items, listName = 'General') => {
    if (!window.gtag) return;
    window.gtag('event', 'view_item_list', {
        item_list_name: listName,
        items: items.map(item => ({
            item_id: item.product_id || item.id,
            item_name: item.title,
            item_category: item.category,
            price: Number(item.final_price)
        }))
    });
};

export const trackSelectItem = (item, listName = 'General') => {
    if (!window.gtag) return;
    window.gtag('event', 'view_item', {
        item_list_name: listName,
        items: [{
            item_id: item.product_id || item.id,
            item_name: item.title,
            item_category: item.category,
            price: Number(item.final_price)
        }]
    });
};

export const trackAddToCart = (item, quantity = 1) => {
    if (!window.gtag) return;
    window.gtag('event', 'add_to_cart', {
        currency: 'USD',
        value: Number(item.final_price) * quantity,
        items: [{
            item_id: item.product_id || item.id,
            item_name: item.title,
            item_category: item.category,
            price: Number(item.final_price),
            quantity: quantity
        }]
    });
};

export const trackViewCart = (items, totalValue) => {
    if (!window.gtag) return;
    window.gtag('event', 'view_cart', {
        currency: 'USD',
        value: totalValue,
        items: items.map(item => ({
            item_id: item.product_id || item.id,
            item_name: item.title,
            price: Number(item.final_price),
            quantity: item.quantity
        }))
    });
};

export const trackBeginCheckout = (items, totalValue) => {
    if (!window.gtag) return;
    window.gtag('event', 'begin_checkout', {
        currency: 'USD',
        value: totalValue,
        items: items.map(item => ({
            item_id: item.product_id || item.id,
            item_name: item.title,
            price: Number(item.final_price),
            quantity: item.quantity
        }))
    });
};

export const trackPurchaseDemo = (items, totalValue, transaction_id) => {
    if (!window.gtag) return;
    window.gtag('event', 'purchase', {
        transaction_id: transaction_id,
        value: totalValue,
        tax: Number((totalValue * 0.08).toFixed(2)),
        currency: 'USD',
        items: items.map(item => ({
            item_id: item.product_id || item.id,
            item_name: item.title,
            price: Number(item.final_price),
            quantity: item.quantity
        }))
    });
};

export const trackOpenChatbot = () => {
    if (!window.gtag) return;
    window.gtag('event', 'chatbot_query', {
        action: 'open_chatbot'
    });
};

export const trackSendChatMessage = (messageType = 'text') => {
    if (!window.gtag) return;
    window.gtag('event', 'chatbot_query', {
        action: 'send_message',
        message_type: messageType
    });
};

export const trackChatbotRecommendationClick = (item) => {
    if (!window.gtag) return;
    window.gtag('event', 'recommendation_click', {
        action: 'click_chat_recommendation',
        item_id: item.product_id || item.id,
        item_name: item.title
    });
};
