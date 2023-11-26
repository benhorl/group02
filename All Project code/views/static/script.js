function toggleButton(event, username, restaurant) {
    const button = event.currentTarget;
    const iconPlus = button.querySelector('.iconPlus');
    const iconCheck = button.querySelector('.iconCheck');

    button.classList.toggle('checked');
    iconPlus.style.opacity = iconPlus.style.opacity === '0' ? '1' : '0';
    iconCheck.style.opacity = iconCheck.style.opacity === '1' ? '0' : '1';

    if (button.classList.contains('checked')) {
        addToWishlist(username, restaurant);
    } else {
        removeFromWishlist(username, restaurant);
    }
}

async function addToWishlist(username, restaurant) {
    try {
        const response = await fetch(`/wishlist/${username}/${restaurant}`, {
            method: 'POST',
        });

        if (response.ok) {
            console.log('Added to wishlist successfully');
        } else {
            console.error('Failed to add to wishlist');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function removeFromWishlist(username, restaurant) {
    try {
        const response = await fetch(`/wishlist/${username}/${restaurant}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            console.log('Removed from wishlist successfully');
        } else {
            console.error('Failed to remove from wishlist');
        }
    } catch (error) {
        console.error('Error:', error);
    }
}