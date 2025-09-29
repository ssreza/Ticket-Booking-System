// Mock user type
export type MockUser = {
  id: string;
  name: string;
  avatar: string;
};

/**
 * Generates a random user with name, ID, and avatar
 * @returns MockUser object with random data
 */
export const generateRandomUser = (): MockUser => {
  // List of first names
  const firstNames = [
    'Alex', 'Jamie', 'Adam', 'Jordan', 'Casey', 'Riley', 'Morgan', 'Avery',
    'Quinn', 'Blake', 'Cameron', 'Reese', 'Finley', 'River', 'Dakota', 'Emerson'
  ];

  // List of last names
  const lastNames = [
    'Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson',
    'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin'
  ];

  // Generate random ID
  const userId = `user_${Math.random().toString(36).substring(2, 10)}`;
  
  // Pick random first name
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  
  // Pick random last name (ensuring it's not the same as firstName)
  let lastName;
  do {
    lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  } while (lastName.toLowerCase() === firstName.toLowerCase());
  
  // Create full name
  const fullName = `${firstName} ${lastName}`;
  
  // Choose from several minimalist avatar options
  
  // Option 1: UI Avatars - Simple colored circle with initials
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`;
  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&size=128&bold=true&format=svg`;
  
  
  return {
    id: userId,
    name: fullName,
    avatar
  };
};

/**
 * Gets an existing user from localStorage or creates a new one
 * @returns MockUser object
 */
export const getOrCreateUser = (): MockUser => {
  if (typeof window === 'undefined') {
    // Return a placeholder during server-side rendering
    return {
      id: 'server_render',
      name: 'Server Render',
      avatar: ''
    };
  }
  
  const savedUser = sessionStorage.getItem('mockUser');
  if (savedUser) {
    try {
      return JSON.parse(savedUser);
    } catch (e) {
      // If parsing fails, generate a new user
    }
  }
  
  // Create a new user if none exists or parsing failed
  const newUser = generateRandomUser();
  sessionStorage.setItem('mockUser', JSON.stringify(newUser));
  return newUser;
};
