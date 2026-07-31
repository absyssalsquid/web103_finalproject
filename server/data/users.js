import { DateTime} from 'luxon'

const users = [
    {   username: 'guiltygoose',
        email: 'test2@gmail.com',
        pw: 'aweapontosurpass',
        created_at: DateTime.local(2025, 2, 7, 15),
        image_url: "https://images.squarespace-cdn.com/content/v1/5979177946c3c4cf12d4fb7c/1560806448788-CUXJOXPEWI6C4RUT25UL/goosehead.gif?format=1500w",
        flair: 24,
        },
        

    {   username: 'hardboileddetective',
        email: 'test3@gmail.com',
        pw: 'gutsygumshoe',
        created_at: DateTime.local(2025, 12, 2, 11),
        image_url: "https://play-lh.googleusercontent.com/LMJHiS55RN82NDFjKOkymuZkIg0d2QmnhnTgZgk1d5H-EyvmOZNx98UlEi9zrMtQwdbmOJuyxuThkMuKUbHW8Q",
        flair: 61,
        },

    {   username: 'cardinalrule',
        email: 'test4@gmail.com',
        pw: 'einszweidrei',
        created_at: DateTime.local(2026, 1, 3, 11, 23),
        image_url: 'https://bunny-wp-pullzone-ycwxiuzyik.b-cdn.net/wp-content/uploads/2021/09/NOCA_Mick-Thompson.jpg',
        flair: 9
        },

    {   username: 'uterwegsmitdentauben',
        flair: null,
        email: 'test5@gmail.com',
        pw: 'dassingmeinejungs',
        created_at: DateTime.local(2026, 2, 14, 8, 19),
        image_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQmX9TwG20hvXKK3Va2Qh6iKyFvT2ybyonn4Sj9xK3286PhIWFgFTsyfOCI&s=10'
        },

    {   username: 'egg',
        email: 'test6@gmail.com',
        pw: 'bananas2',
        created_at: DateTime.local(2026, 6, 27, 8),
        image_url: 'https://chirpforbirds.com/wp-content/uploads/2023/04/Egg-hatching-1-scaled.jpg',
        bio: 'just a normal egg',
        flair: 3,
        },
]

export default users