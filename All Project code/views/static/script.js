function toggleButton(event, username, located) {
    const button = event.currentTarget;
    const iconPlus = button.querySelector('.iconPlus');
    const iconCheck = button.querySelector('.iconCheck');

    const restaurant = button.getAttribute('restaurant-name');
    const alias = button.getAttribute('restaurant-alias');

    button.classList.toggle('checked');
    iconPlus.style.opacity = iconPlus.style.opacity === '0' ? '1' : '0';
    iconCheck.style.opacity = iconCheck.style.opacity === '1' ? '0' : '1';

    if (button.classList.contains('checked')) {
        addToWishlist(username, restaurant, located, alias);
    } else {
        removeFromWishlist(username, restaurant, located, alias);
    }
}

async function addToWishlist(username, restaurant, located, alias) {
    try {
        const response = await fetch(`/wishlist/${username}/${restaurant}/${located}/${alias}`, {
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

async function removeFromWishlist(username, restaurant, located, alias) {
    try {
        const response = await fetch(`/wishlist/${username}/${restaurant}/${located}/${alias}`, {
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

document.addEventListener('DOMContentLoaded', function () { //event listener for remove buttons
    const removeButtons = document.querySelectorAll('.remove-button'); //store the remove buttons
    removeButtons.forEach(button => { //parse through each remove button
        button.addEventListener('click', function () { //when clicked
            const username = this.getAttribute('data-username'); //get this username
            const restaurant = this.getAttribute('data-restaurant'); //get this restaurant
            const located = this.getAttribute('data-located'); //get this location
            const alias = this.getAttribute('data-alias'); //get this alias

            //send request using those attributes to delete from the database
            fetch(`/wishlist/${username}/${restaurant}/${located}/${alias}`, {
                method: 'DELETE'
            })
            .then(response => {
                if (response.ok) {
                    //get the wishlist-item that correlates with this button we are on
                    const removeUI = this.closest('.wishlist-item');
                    if(removeUI){ //if we find a match
                        removeUI.remove(); //remove it from our current UI

                        const remainingListGroups = document.querySelectorAll('.list-group');//check list-group
                        if (remainingListGroups.length === 0) { //if list-group is empty
                            location.reload(); //refresh the page
                        }
                    } else {
                        console.error('List item not found.');
                    }
                } else {
                    console.error('Error:', response.statusText);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
        });
    });
});
