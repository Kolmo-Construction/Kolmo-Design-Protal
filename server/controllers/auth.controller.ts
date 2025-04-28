import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { z } from 'zod';
import { storage } from '../storage';
import { User, insertUserSchema } from '../../shared/schema';
import { HttpError } from '../errors';
import { sendMagicLinkEmail, isEmailServiceConfigured } from '../email';
import { randomBytes } from 'crypto';

// --- Zod Schemas for API Input Validation ---

const loginSchema = z.object({
  // Allow either email or username, depending on your Passport strategy config
  email: z.string().email("Invalid email format."),
  // username: z.string().min(1, "Username is required."),
  password: z.string().min(1, "Password is required."),
});

const magicLinkRequestSchema = z.object({
  email: z.string().email("Invalid email format."),
});

const magicLinkVerifySchema = z.object({
  token: z.string().uuid("Invalid token format."),
});

// Schema for setting up profile after magic link login
const profileSetupSchema = insertUserSchema.pick({
    firstName: true,
    lastName: true,
}).extend({
    // Require password during profile setup
    password: z.string().min(8, "Password must be at least 8 characters long."), // Add more complexity rules if needed
});

// --- Controller Functions ---

/**
 * Handles response after successful Passport local authentication.
 * The actual authentication is done by passport.authenticate('local') middleware before this.
 */
export const loginUser = (req: Request, res: Response, next: NextFunction): void => {
  // If this function is reached, authentication was successful.
  // req.user should be populated by passport.authenticate middleware via req.login.
  // We simply return the user information.
  if (!req.user) {
    // This shouldn't happen if middleware succeeded, but handle defensively
    return next(new HttpError(500, 'Login successful but user data unavailable in request.'));
  }
  res.status(200).json(req.user);
};

/**
 * Logs the current user out, destroys the session, and clears the cookie.
 * Assumes isAuthenticated middleware runs before this.
 */
export const logoutUser = (req: Request, res: Response, next: NextFunction): void => {
  req.logout((logoutErr) => {
    if (logoutErr) {
      console.error('Error during req.logout:', logoutErr);
      // Decide if error is critical. Usually okay to proceed to session destroy.
      // return next(new HttpError(500, 'Logout failed.'));
    }

    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        console.error('Error destroying session:', destroyErr);
        // Even if destroy fails, clearing cookie might help.
        // return next(new HttpError(500, 'Failed to destroy session during logout.'));
      }

      // Clear the session cookie
      // Cookie name depends on session middleware config (default 'connect.sid')
      res.clearCookie('connect.sid', {
          // Ensure cookie options match session middleware (path, domain, httpOnly, secure, etc.)
          // path: '/', // Example
          // httpOnly: true, // Example
          // secure: process.env.NODE_ENV === 'production', // Example
          // sameSite: 'lax', // Example
      });
      res.status(200).json({ message: 'Logout successful' }); // Send 200 OK for client handling
    });
  });
};

/**
 * Checks if a user session exists and returns user data if logged in.
 */
export const getAuthStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (req.isAuthenticated() && req.user) {
       // req.user might only contain the ID depending on deserializeUser.
       // Fetch full, up-to-date user details.
       // Ensure sensitive data (like password hash) is not included.
       const user = await storage.getUser(req.user.id);

       if (user) {
            // Remove sensitive data
            const { password, magicLinkToken, magicLinkExpiry, ...userWithoutSensitiveData } = user;
            res.status(200).json({ isAuthenticated: true, user: userWithoutSensitiveData });
       } else {
           // User existed in session but not in DB? Log out.
           console.warn(`User ID ${req.user.id} found in session but not in DB.`);
            req.logout(() => { /* ignore error */ });
            req.session.destroy(() => { /* ignore error */ });
            res.clearCookie('connect.sid');
            res.status(200).json({ isAuthenticated: false, user: null });
       }
    } else {
      res.status(200).json({ isAuthenticated: false, user: null });
    }
  } catch (error) {
    next(error);
  }
};

// Helper function to generate a magic link token
function generateMagicLinkToken(): string {
  return randomBytes(32).toString("hex");
}

// Helper function to calculate expiry time (default: 24 hours from now)
function getMagicLinkExpiry(hours = 24): Date {
  const expiryDate = new Date();
  expiryDate.setHours(expiryDate.getHours() + hours);
  return expiryDate;
}

// Helper function to handle the creation and sending of magic links
async function createAndSendMagicLink(email: string): Promise<boolean> {
  // Check if user exists
  const user = await storage.getUserByEmail(email);
  if (!user) {
    // If user doesn't exist, we shouldn't reveal this, but log it for debugging
    console.log(`No user found with email: ${email}`);
    return false;
  }

  // Generate token and expiry date
  const token = generateMagicLinkToken();
  const expiry = getMagicLinkExpiry();

  // Update user with magic link token
  await storage.updateUserMagicLinkToken(user.id, token, expiry);

  // Get hostname for link
  const host = process.env.NODE_ENV === 'production' 
    ? process.env.HOST || 'localhost:5000'
    : 'localhost:5000';

  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const magicLink = `${protocol}://${host}/auth/magic-link/${token}`;

  // Send the email
  if (isEmailServiceConfigured()) {
    return await sendMagicLinkEmail({
      email,
      firstName: user.firstName,
      token,
      isNewUser: !user.isActivated
    });
  } else {
    console.warn('Email service not configured. Magic link will not be sent.');
    console.log(`[DEV] Magic link for ${email}: ${magicLink}`);
    return false;
  }
}

/**
 * Initiates the magic link login process for a given email.
 */
export const requestMagicLink = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validationResult = magicLinkRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw new HttpError(400, 'Invalid email format.', validationResult.error.flatten());
    }
    const { email } = validationResult.data;

    // Create and send the magic link
    await createAndSendMagicLink(email);

    // Always return OK to prevent email enumeration attacks
    res.status(200).json({ message: 'If an account exists for this email, a magic link has been sent.' });
  } catch (error) {
     // Log the actual error on the server, but don't reveal details to client
     console.error("Error requesting magic link:", error);
     // Still return a generic success message
     res.status(200).json({ message: 'If an account exists for this email, a magic link has been sent.' });
     // Or if you want to signal server error without details:
     // next(new HttpError(500, 'Could not process magic link request.'));
  }
};


// Helper function to verify a magic link token and retrieve the associated user
async function verifyMagicTokenAndGetUser(token: string): Promise<User | null> {
  if (!token) {
    throw new HttpError(400, 'Invalid token');
  }

  const user = await storage.getUserByMagicLinkToken(token);

  if (!user) {
    throw new HttpError(404, 'Invalid or expired link');
  }

  // Check if the token has expired
  if (user.magicLinkExpiry && new Date(user.magicLinkExpiry) < new Date()) {
    throw new HttpError(401, 'Magic link has expired');
  }

  // Mark the token as used by removing it
  await storage.updateUserMagicLinkToken(user.id, null, null);

  return user;
}

/**
 * Verifies a magic link token, logs the user in, and checks profile status.
 */
export const verifyMagicLink = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const tokenValidation = magicLinkVerifySchema.safeParse(req.query);
        if (!tokenValidation.success) {
            throw new HttpError(400, 'Invalid or missing magic link token.');
        }
        const { token } = tokenValidation.data;

        // Verify token and get user
        const user = await verifyMagicTokenAndGetUser(token);

        if (!user) {
            // Should be handled by verifyMagicTokenAndGetUser throwing, but belts-and-suspenders
             throw new HttpError(401, 'Invalid or expired magic link token.');
        }

        // Log the user in using req.login provided by Passport
        req.login(user, (loginErr) => {
            if (loginErr) {
                console.error('Failed to login user after magic link verification:', loginErr);
                return next(new HttpError(500, 'Failed to establish session after verification.'));
            }

            // Check if profile setup is needed
            const needsProfileSetup = !user.isActivated; // Check activation status

            // Successfully logged in
            res.status(200).json({
                message: 'Magic link verified successfully.',
                user: user, // Send user data back
                needsProfileSetup: needsProfileSetup, // Signal to client if next step is needed
            });
        });

    } catch(error) {
        next(error); // Pass HttpErrors (400/401 from verify) or other errors
    }
};

// Helper function to hash passwords securely
async function hashPassword(password: string): Promise<string> {
  const { randomBytes, scrypt } = await import('crypto');
  const { promisify } = await import('util');
  
  const scryptAsync = promisify(scrypt);
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Sets up user profile (name, password) after magic link login.
 * Assumes isAuthenticated middleware runs before this.
 */
export const setupProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
     try {
        const user = req.user as User; // Authenticated user (via magic link)
        if (!user?.id) {
            throw new HttpError(401, 'Authentication required. Please log in again.');
        }

        const validationResult = profileSetupSchema.safeParse(req.body);
        if (!validationResult.success) {
            throw new HttpError(400, 'Invalid profile data.', validationResult.error.flatten());
        }
        const { firstName, lastName, password } = validationResult.data;

        // Hash the password
        const hashedPassword = await hashPassword(password);
        
        // Update the user profile
        const updatedUser = await storage.updateUser(user.id, {
          firstName,
          lastName,
          password: hashedPassword,
          isActivated: true // Mark as activated
        });

        if (!updatedUser) {
             throw new HttpError(500, 'Failed to update profile.');
        }

        // Remove sensitive information from response
        const { password: _, magicLinkToken, magicLinkExpiry, ...userWithoutSensitiveData } = updatedUser;

        // Return the updated user profile
        res.status(200).json({
          message: "Profile setup complete",
          user: userWithoutSensitiveData
        });

     } catch(error) {
        next(error);
     }
};