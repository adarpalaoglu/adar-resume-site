let cvData;
let player;
let platforms;
let cursors;
let currentPopup = null;
let educationSubPlatforms = null;
let lastPlatform = null;

// Global popup elements - created once
let popupContainer;
let popupTitle;
let popupContent;
let popupCloseButton;

class CVGame extends Phaser.Scene {
    constructor() {
        super('CVGame');
    }

    preload() {
        this.load.image('background', 'assets/background.png');
        this.load.image('platform', 'assets/platform.png');
        this.load.image('player', 'assets/player.png'); // Placeholder for player
        this.load.json('cvData', 'cv.json');
    }

    create() {
        cvData = this.cache.json.get('cvData');

        // Set world bounds to be wider to accommodate more platforms
        const worldWidth = 2500; // Increased world width
        const worldHeight = 600;
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        // Background - scale and set scroll factor to cover the extended world
        // setScrollFactor(1, 0) makes it scroll horizontally with the camera but not vertically
        this.add.image(0, 0, 'background').setOrigin(0, 0).setScale(1.5).setScrollFactor(1, 0);

        // Player
        player = this.physics.add.sprite(100, 450, 'player');
        player.setBounce(0.2);
        player.setCollideWorldBounds(true); // Player stays within the new world bounds
        player.setOrigin(0.5, 1); // Set origin to bottom-center for more reliable ground detection

        // Platforms
        platforms = this.physics.add.staticGroup();

        // Main platforms - Adjusted positions for better flow and extended world
        this.createPlatform(250, 500, 'About', 'about');
        this.createPlatform(400, 450, 'Platform', null); // Intermediate platform
        this.createPlatform(550, 400, 'Experience', 'experience');
        this.createPlatform(700, 350, 'Platform', null); // Intermediate platform
        this.createPlatform(850, 300, 'Education', 'education');
        this.createPlatform(1000, 350, 'Platform', null); // Intermediate platform
        this.createPlatform(1150, 400, 'Projects', 'projects');
        this.createPlatform(1300, 450, 'Platform', null); // Intermediate platform
        this.createPlatform(1450, 500, 'Contact', 'contact');
        this.createPlatform(1600, 450, 'Platform', null); // More intermediate platforms
        this.createPlatform(1750, 400, 'Platform', null);
        this.createPlatform(1900, 350, 'Platform', null);
        this.createPlatform(2050, 300, 'Platform', null);
        this.createPlatform(2200, 250, 'Platform', null);

        // Add collider between player and platforms
        this.physics.add.collider(player, platforms, this.onPlatformLand, null, this);

        // Input Cursors
        cursors = this.input.keyboard.createCursorKeys();
        // Add Spacebar input
        this.spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // Camera follows player - set camera bounds to match world bounds
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.startFollow(player);
        // Adjust deadzone for smoother camera follow, keeping player roughly centered
        this.cameras.main.setDeadzone(this.game.config.width * 0.2, this.game.config.height * 0.5); 

        // --- Popup DOM Element Creation (created once) ---
        popupContainer = document.createElement('div');
        popupContainer.className = 'popup';
        popupContainer.tabIndex = -1; // Make it programmatically focusable but not naturally via tab

        popupCloseButton = document.createElement('button');
        popupCloseButton.className = 'close-button';
        popupCloseButton.textContent = 'X';
        popupCloseButton.onclick = () => {
            popupContainer.style.display = 'none';
            currentPopup = null;
            if (educationSubPlatforms) {
                educationSubPlatforms.clear(true, true); 
                educationSubPlatforms = null;
            }
            this.game.canvas.focus(); // Return focus to the game canvas after closing popup
        };
        popupContainer.appendChild(popupCloseButton);

        popupTitle = document.createElement('h3');
        popupContainer.appendChild(popupTitle);

        popupContent = document.createElement('div'); // Use a div for content to hold ul/p
        popupContainer.appendChild(popupContent);

        document.body.appendChild(popupContainer);
        popupContainer.style.display = 'none'; // Initially hidden
        // --- End Popup DOM Element Creation ---
    }

    update() {
        // Player horizontal movement
        if (cursors.left.isDown) {
            player.setVelocityX(-160);
        } else if (cursors.right.isDown) {
            player.setVelocityX(160);
        } else {
            player.setVelocityX(0);
        }

        // Player jump - allows jump with Up arrow or Spacebar, only when touching down
        // Changed player.body.touching.down to player.body.blocked.down for more reliable ground detection
        if ((cursors.up.isDown || this.spaceBar.isDown) && player.body.blocked.down) {
            player.setVelocityY(-330); // Adjust jump velocity for desired height
            lastPlatform = null; // Reset last platform on jump
        }
    }

    createPlatform(x, y, label, sectionKey) {
        let platform = platforms.create(x, y, 'platform');
        platform.setScale(0.5); // Adjust platform scale
        platform.setOrigin(0.5, 0.5);
        platform.refreshBody(); // Important for static physics bodies after scaling
        platform.setData('sectionKey', sectionKey);

        // Add label above platform, only if sectionKey is provided and not an intermediate 'Platform'
        if (label && label !== 'Platform') {
            this.add.text(x, y - 50, label, { fontSize: '24px', fill: '#000', backgroundColor: 'rgba(255,255,255,0.7)', padding: { x: 10, y: 5 } })
                .setOrigin(0.5, 0.5)
                .setDepth(1);
        }
    }

    onPlatformLand(player, platform) {
        const sectionKey = platform.getData('sectionKey');
        // Only show popup if it's a new platform and a main section platform
        if (sectionKey && sectionKey !== 'Platform' && platform !== lastPlatform) {
            this.showPopup(sectionKey, platform);
            lastPlatform = platform; // Set the current platform as the last one
        }
    }

    showPopup(sectionKey, platform) {
        // Hide any currently open popup
        if (currentPopup) {
            currentPopup.style.display = 'none';
        }

        // Update content of the single, pre-existing popup elements
        popupTitle.textContent = sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1); // Capitalize first letter
        
        // --- Hardcoded content ---
        let contentHtml = '';
        switch (sectionKey) {
            case 'about':
                contentHtml = `<p>I am a Computer Science student at the University of Warwick, passionate about software engineering, AI, and databases. I enjoy building software projects and have a strong interest in AI, web development, and databases. My goal is to gain experience through internships and contribute to impactful software solutions.</p>`;
                break;
            case 'experience':
                contentHtml = `<ul>
                    <li><b>Intern at NAR Sistem Teknoloji</b> (Jul 2025 – Aug 2025)<br>Summer internship focusing on Artificial Intelligence and building projects.</li>
                    <li><b>Head of Social Executives at Warwick Turkish Society</b> (Feb 2025 – Present)<br>Elected through a society-wide vote. Leading the social team and overseeing the event calendar, ensuring smooth planning and execution of events across terms.</li>
                    <li><b>Social Executive at Warwick Turkish Society</b> (Feb 2024 – Feb 2025)<br>Organised high-capacity events, such as dinners for 100+ attendees and themed parties for 250+ participants. Conducted 1:1 meetings with new international students to support their transition.</li>
                </ul>`;
                break;
            case 'education':
                contentHtml = `<ul>
                    <li><b>University of Warwick</b> - B.Sc. Computer Science (2023-2026)<br>Studying software engineering, databases, AI, and algorithms. Building strong foundations in Java, Python, SQL, and full-stack development.</li>
                    <li><b>TED Ankara College</b> - High School Diploma (2019-2023)<br>International Baccalaureate Diploma Programme. Cumulative GPA: 90.999 / 100, IBDP Score: 33 / 45, High Level Subjects: Mathematics AA, Physics, English B.</li>
                    <li><b>New Brunswick High School</b> - Canadian High School Diploma (2019-2023)<br>Completed Canadian high school curriculum in parallel with TED Ankara College studies, earning a dual diploma.</li>
                </ul>`;
                break;
            case 'projects':
                contentHtml = `<ul>
                    <li><a href="https://github.com/adarpalaoglu/portfolio" target="_blank">Portfolio Website</a><br>A personal website showcasing my projects and experience.</li>
                    <li><a href="https://github.com/adarpalaoglu/example-project-2" target="_blank">Example Project 2</a><br>Description for example project 2.</li>
                </ul>`;
                break;
            case 'contact':
                contentHtml = `
                    <p>Email: <a href="mailto:palaogluadar@gmail.com">palaogluadar@gmail.com</a></p>
                    <p>LinkedIn: <a href="https://www.linkedin.com/in/adar-palao%C4%9Flu-3455a0307/" target="_blank">linkedin.com/in/adar-palao%C4%9Flu-3455a0307/</a></p>
                    <p>GitHub: <a href="https://github.com/adarpalaoglu" target="_blank">github.com/adarpalaoglu</a></p>
                `;
                break;
            default:
                contentHtml = `<p>Details for ${sectionKey} section.</p>`;
        }
        popupContent.innerHTML = contentHtml;
        // --- End Hardcoded content ---

        // Show the popup
        popupContainer.style.display = 'flex';
        currentPopup = popupContainer;

        // Position popup (fixed for now to isolate dynamic positioning as a cause of freeze)
        popupContainer.style.left = '50%';
        popupContainer.style.top = '50%';
        popupContainer.style.transform = 'translate(-50%, -50%)';

        // Explicitly return focus to the game canvas after showing the popup
        this.game.canvas.focus();

        // Special handling for Education sub-platforms (still commented out for now)
        if (sectionKey === 'education' && !educationSubPlatforms) {
            // educationSubPlatforms = this.physics.add.staticGroup();
            // const basePlatformX = platform.x; 

            // cvData.education.forEach((edu, index) => {
            //     const subPlatformX = basePlatformX + (index - 1) * 150; 
            //     const subPlatformY = platform.y - 100 - (index * 50); 

            //     let subPlatform = educationSubPlatforms.create(subPlatformX, subPlatformY, 'platform');
            //     subPlatform.setScale(0.3);
            //     subPlatform.setOrigin(0.5, 0.5);
            //     subPlatform.refreshBody();
            //     subPlatform.setData('eduIndex', index);

            //     this.add.text(subPlatformX, subPlatformY - 30, edu.school.split(' ')[0], { fontSize: '16px', fill: '#000', backgroundColor: 'rgba(255,255,255,0.7)', padding: { x: 5, y: 2 } })
            //         .setOrigin(0.5, 0.5)
            //         .setDepth(1);
            // });
            // this.physics.add.collider(player, educationSubPlatforms, this.onSubPlatformLand, null, this);
        }
    }

    onSubPlatformLand(player, subPlatform) {
        const eduIndex = subPlatform.getData('eduIndex');
        if (eduIndex !== undefined) {
            // const eduDetails = cvData.education[eduIndex];
            // let detailsContent = `<b>${eduDetails.school}</b> - ${eduDetails.degree}`;
            // if (eduDetails.details) {
            //     detailsContent += `<br>${eduDetails.details}`;
            // }
            // if (eduDetails.modules) {
            //     detailsContent += `<br>Modules: ${eduDetails.modules.join(', ')}`;
            // }

            // // Hide any currently open popup
            // if (currentPopup) {
            //     currentPopup.style.display = 'none';
            // }

            // // Update content of the single, pre-existing popup elements
            // popupTitle.textContent = eduDetails.school;
            // // popupContent.innerHTML = detailsContent; // Directly set innerHTML for sub-popup content

            // // Show the popup
            // popupContainer.style.display = 'flex';
            // currentPopup = popupContainer;

            // // Position popup (fixed for now to isolate dynamic positioning as a cause of freeze)
            // popupContainer.style.left = '50%';
            // popupContainer.style.top = '50%';
            // popupContainer.style.transform = 'translate(-50%, -50%)';

            // this.game.canvas.focus(); // Explicitly return focus to the game canvas after showing the popup
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 }, // Gravity applied to player
            debug: false // Set to false to remove debug visuals
        }
    },
    scene: CVGame
};

const game = new Phaser.Game(config);
