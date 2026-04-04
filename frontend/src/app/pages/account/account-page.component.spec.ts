import { AvatarEditorCropState, ToastService } from '@eagami/ui';

import { NO_ERRORS_SCHEMA, WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { ApiService } from '@app/services/api.service';
import { ClerkService } from '@app/services/clerk.service';
import { UserService } from '@app/services/user.service';

import { AccountPageComponent } from './account-page.component';

jest.mock('@env', () => ({
  environment: {
    production: false,
    clerkPublishableKey: 'test-key',
    apiUrl: 'http://localhost:3000/api',
    preview: null,
  },
}));

type MockUser = {
  firstName: string;
  lastName: string;
  hasImage: boolean;
  imageUrl: string;
};

type MockClerkService = {
  user: WritableSignal<MockUser | null>;
  reloadUser: jest.Mock<Promise<void>>;
  updateProfile: jest.Mock<Promise<void>, [string, string]>;
  setProfileImage: jest.Mock<Promise<string | undefined>, [Blob | null]>;
  logOut: jest.Mock<Promise<void>>;
  extractError: jest.Mock<string, [unknown]>;
};

type MockRouter = {
  navigate: jest.Mock<Promise<boolean>, [string[]]>;
};

type MockApiService = {
  get: jest.Mock<Promise<unknown>>;
  patch: jest.Mock<Promise<unknown>>;
  post: jest.Mock<Promise<unknown>>;
  delete: jest.Mock<Promise<unknown>>;
};

type MockUserService = {
  user: WritableSignal<{ firstName: string; lastName: string } | null>;
  avatarUrl: WritableSignal<string | undefined>;
  avatarCropState: WritableSignal<AvatarEditorCropState | null>;
  hasAvatar: WritableSignal<boolean>;
  load: jest.Mock<Promise<void>>;
  setUser: jest.Mock<void>;
  clearAvatar: jest.Mock<void>;
};

type MockToastService = {
  success: jest.Mock<number, [string]>;
  error: jest.Mock<number, [string]>;
};

const MOCK_USER: MockUser = {
  firstName: 'John',
  lastName: 'Doe',
  hasImage: false,
  imageUrl: '',
};

async function createComponent(
  mockClerk: MockClerkService,
  mockApi: MockApiService,
  mockUserService: MockUserService,
  mockToast: MockToastService,
  mockRouter: MockRouter,
): Promise<AccountPageComponent> {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [AccountPageComponent],
    providers: [
      { provide: ClerkService, useValue: mockClerk },
      { provide: ApiService, useValue: mockApi },
      { provide: UserService, useValue: mockUserService },
      { provide: ToastService, useValue: mockToast },
      { provide: Router, useValue: mockRouter },
    ],
  })
    .overrideComponent(AccountPageComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

  const fixture = TestBed.createComponent(AccountPageComponent);
  fixture.detectChanges();
  return fixture.componentInstance;
}

describe('AccountPageComponent', () => {
  let component: AccountPageComponent;
  let mockClerk: MockClerkService;
  let mockApi: MockApiService;
  let mockUserService: MockUserService;
  let mockToast: MockToastService;
  let mockRouter: MockRouter;

  beforeEach(async () => {
    mockClerk = {
      user: signal<MockUser | null>({ ...MOCK_USER }),
      reloadUser: jest.fn().mockResolvedValue(undefined),
      updateProfile: jest.fn().mockResolvedValue(undefined),
      setProfileImage: jest.fn().mockResolvedValue('https://img.clerk.com/updated'),
      logOut: jest.fn().mockResolvedValue(undefined),
      extractError: jest.fn().mockReturnValue('Something went wrong'),
    };

    mockRouter = {
      navigate: jest.fn().mockResolvedValue(true),
    };

    mockApi = {
      get: jest.fn().mockResolvedValue({}),
      patch: jest.fn().mockResolvedValue({}),
      post: jest.fn().mockResolvedValue({
        id: 'user-1',
        avatarOriginalUrl: null,
        avatarCropState: null,
        lastModifiedDate: '2026-04-02T00:00:00.000Z',
      }),
      delete: jest.fn().mockResolvedValue({}),
    };

    mockUserService = {
      user: signal(null),
      avatarUrl: signal(undefined),
      avatarCropState: signal(null),
      hasAvatar: signal(false),
      load: jest.fn().mockResolvedValue(undefined),
      setUser: jest.fn(),
      clearAvatar: jest.fn(),
    };

    mockToast = {
      success: jest.fn().mockReturnValue(1),
      error: jest.fn().mockReturnValue(2),
    };

    component = await createComponent(
      mockClerk,
      mockApi,
      mockUserService,
      mockToast,
      mockRouter,
    );
  });

  // ---------------------------------------------------------------------------
  // Initialization
  // ---------------------------------------------------------------------------

  describe('ngOnInit', () => {
    it('sets firstName and lastName from clerk user', () => {
      expect(component.firstName()).toBe('John');
      expect(component.lastName()).toBe('Doe');
    });

    it('sets empty strings when clerk user has no name', async () => {
      mockClerk.user = signal(null);

      component = await createComponent(
        mockClerk,
        mockApi,
        mockUserService,
        mockToast,
        mockRouter,
      );

      expect(component.firstName()).toBe('');
      expect(component.lastName()).toBe('');
    });

    it('sets editorSrc from userService.avatarUrl', async () => {
      mockUserService.avatarUrl = signal('http://api/users/u1/avatar?t=123');

      component = await createComponent(
        mockClerk,
        mockApi,
        mockUserService,
        mockToast,
        mockRouter,
      );

      expect(component.editorSrc()).toBe('http://api/users/u1/avatar?t=123');
    });

    it('refreshes user data from backend on init', async () => {
      mockUserService.load.mockImplementation(async () => {
        mockUserService.user.set({ firstName: 'Jane', lastName: 'Smith' });
      });

      component = await createComponent(
        mockClerk,
        mockApi,
        mockUserService,
        mockToast,
        mockRouter,
      );

      await mockUserService.load();

      expect(mockUserService.load).toHaveBeenCalled();
      expect(component.firstName()).toBe('Jane');
      expect(component.lastName()).toBe('Smith');
    });

    it('sets savedCropState and liveCropState from userService.avatarCropState', async () => {
      const cropState: AvatarEditorCropState = { zoom: 2, offsetX: 10, offsetY: 5 };
      mockUserService.avatarCropState = signal(cropState);

      component = await createComponent(
        mockClerk,
        mockApi,
        mockUserService,
        mockToast,
        mockRouter,
      );

      expect(component.savedCropState()).toEqual(cropState);
      expect(component.liveCropState()).toEqual(cropState);
    });
  });

  // ---------------------------------------------------------------------------
  // Signal: editorSrc
  // ---------------------------------------------------------------------------

  describe('editorSrc', () => {
    it('is undefined when userService has no avatar', () => {
      expect(component.editorSrc()).toBeUndefined();
    });

    it('reflects the userService avatarUrl on init', async () => {
      mockUserService.avatarUrl = signal('http://api/users/u1/avatar?t=123');

      component = await createComponent(
        mockClerk,
        mockApi,
        mockUserService,
        mockToast,
        mockRouter,
      );

      expect(component.editorSrc()).toBe('http://api/users/u1/avatar?t=123');
    });
  });

  // ---------------------------------------------------------------------------
  // Computed: hasChanges
  // ---------------------------------------------------------------------------

  describe('hasChanges', () => {
    it('is false when nothing has changed', () => {
      expect(component.hasChanges()).toBe(false);
    });

    it('is true when firstName differs from the clerk user', () => {
      component.firstName.set('Jane');

      expect(component.hasChanges()).toBe(true);
    });

    it('is true when lastName differs from the clerk user', () => {
      component.lastName.set('Smith');

      expect(component.hasChanges()).toBe(true);
    });

    it('is true when avatarDirty is set', () => {
      component.avatarDirty.set(true);

      expect(component.hasChanges()).toBe(true);
    });

    it('is false after reverting firstName to its original value', () => {
      component.firstName.set('Different');
      expect(component.hasChanges()).toBe(true);

      component.firstName.set('John');

      expect(component.hasChanges()).toBe(false);
    });

    it('is true when liveCropState differs from savedCropState', () => {
      component.savedCropState.set({ zoom: 1, offsetX: 0, offsetY: 0 });
      component.liveCropState.set({ zoom: 2, offsetX: 10, offsetY: 5 });

      expect(component.hasChanges()).toBe(true);
    });

    it('is false when liveCropState matches savedCropState', () => {
      const state: AvatarEditorCropState = { zoom: 2, offsetX: 10, offsetY: 5 };
      component.savedCropState.set(state);
      component.liveCropState.set({ ...state });

      expect(component.hasChanges()).toBe(false);
    });

    it('is false for crop changes when avatarDirty is set (handled by photo save)', () => {
      component.savedCropState.set({ zoom: 1, offsetX: 0, offsetY: 0 });
      component.liveCropState.set({ zoom: 2, offsetX: 10, offsetY: 5 });
      component.avatarDirty.set(true);

      expect(component.hasChanges()).toBe(true); // true because avatarDirty, not cropChanged
    });
  });

  // ---------------------------------------------------------------------------
  // onRemoveAvatar
  // ---------------------------------------------------------------------------

  describe('onRemoveAvatar', () => {
    it('sets avatarDirty to true', () => {
      component.onRemoveAvatar();

      expect(component.avatarDirty()).toBe(true);
    });

    it('sets removeAvatar to true', () => {
      component.onRemoveAvatar();

      expect(component.removeAvatar()).toBe(true);
    });

    it('clears originalFile', () => {
      component.originalFile = new File([''], 'test.jpg');

      component.onRemoveAvatar();

      expect(component.originalFile).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // onFileSelected
  // ---------------------------------------------------------------------------

  describe('onFileSelected', () => {
    it('sets originalFile', () => {
      const file = new File(['data'], 'photo.jpg');

      component.onFileSelected(file);

      expect(component.originalFile).toBe(file);
    });

    it('sets avatarDirty to true', () => {
      const file = new File(['data'], 'photo.jpg');

      component.onFileSelected(file);

      expect(component.avatarDirty()).toBe(true);
    });

    it('sets removeAvatar to false', () => {
      component.removeAvatar.set(true);
      const file = new File(['data'], 'photo.jpg');

      component.onFileSelected(file);

      expect(component.removeAvatar()).toBe(false);
    });

    it('resets liveCropState to null', () => {
      component.liveCropState.set({ zoom: 2, offsetX: 10, offsetY: 5 });
      const file = new File(['data'], 'photo.jpg');

      component.onFileSelected(file);

      expect(component.liveCropState()).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // onCropStateChange
  // ---------------------------------------------------------------------------

  describe('onCropStateChange', () => {
    it('updates liveCropState', () => {
      const state: AvatarEditorCropState = { zoom: 2, offsetX: 10, offsetY: 5 };

      component.onCropStateChange(state);

      expect(component.liveCropState()).toEqual(state);
    });
  });

  // ---------------------------------------------------------------------------
  // onSave — validation
  // ---------------------------------------------------------------------------

  describe('onSave — validation', () => {
    it('sets firstNameError and does not save when firstName is empty', async () => {
      component.firstName.set('');

      await component.onSave();

      expect(component.firstNameError()).toBe('First name is required');
      expect(mockClerk.updateProfile).not.toHaveBeenCalled();
    });

    it('sets lastNameError and does not save when lastName is empty', async () => {
      component.lastName.set('');

      await component.onSave();

      expect(component.lastNameError()).toBe('Last name is required');
      expect(mockClerk.updateProfile).not.toHaveBeenCalled();
    });

    it('sets both errors when both names are empty', async () => {
      component.firstName.set('');
      component.lastName.set('');

      await component.onSave();

      expect(component.firstNameError()).toBe('First name is required');
      expect(component.lastNameError()).toBe('Last name is required');
    });

    it('treats whitespace-only names as empty', async () => {
      component.firstName.set('   ');

      await component.onSave();

      expect(component.firstNameError()).toBe('First name is required');
    });

    it('clears existing errors before re-validating', async () => {
      component.firstName.set('');
      await component.onSave();
      expect(component.firstNameError()).toBe('First name is required');

      component.firstName.set('John');
      await component.onSave();

      expect(component.firstNameError()).toBe('');
    });
  });

  // ---------------------------------------------------------------------------
  // onSave — name changes
  // ---------------------------------------------------------------------------

  describe('onSave — name changes', () => {
    it('calls clerk.updateProfile when firstName changes', async () => {
      component.firstName.set('Jane');

      await component.onSave();

      expect(mockClerk.updateProfile).toHaveBeenCalledWith('Jane', 'Doe');
    });

    it('calls clerk.updateProfile when lastName changes', async () => {
      component.lastName.set('Smith');

      await component.onSave();

      expect(mockClerk.updateProfile).toHaveBeenCalledWith('John', 'Smith');
    });

    it('does not call clerk.updateProfile when only the photo changes', async () => {
      component.avatarDirty.set(true);
      component.originalFile = new File(['img'], 'photo.jpg');
      jest.spyOn(component, 'exportCrop').mockResolvedValue(new Blob());

      await component.onSave();

      expect(mockClerk.updateProfile).not.toHaveBeenCalled();
    });

    it('patches the backend with only firstName when only it changes', async () => {
      component.firstName.set('Jane');

      await component.onSave();

      expect(mockApi.patch).toHaveBeenCalledWith('/users/me', { firstName: 'Jane' });
    });

    it('patches the backend with only lastName when only it changes', async () => {
      component.lastName.set('Smith');

      await component.onSave();

      expect(mockApi.patch).toHaveBeenCalledWith('/users/me', { lastName: 'Smith' });
    });

    it('patches the backend with both names when both change', async () => {
      component.firstName.set('Jane');
      component.lastName.set('Smith');

      await component.onSave();

      expect(mockApi.patch).toHaveBeenCalledWith('/users/me', {
        firstName: 'Jane',
        lastName: 'Smith',
      });
    });

    it('does not patch the backend when the name is unchanged', async () => {
      component.avatarDirty.set(true);
      component.originalFile = new File(['img'], 'photo.jpg');
      jest.spyOn(component, 'exportCrop').mockResolvedValue(new Blob());

      await component.onSave();

      expect(mockApi.patch).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // onSave — success toast messages
  // ---------------------------------------------------------------------------

  describe('onSave — success toast', () => {
    it('shows "First name updated" when only firstName changes', async () => {
      component.firstName.set('Jane');

      await component.onSave();

      expect(mockToast.success).toHaveBeenCalledWith('First name updated');
    });

    it('shows "Last name updated" when only lastName changes', async () => {
      component.lastName.set('Smith');

      await component.onSave();

      expect(mockToast.success).toHaveBeenCalledWith('Last name updated');
    });

    it('shows "First name and last name updated" when both names change', async () => {
      component.firstName.set('Jane');
      component.lastName.set('Smith');

      await component.onSave();

      expect(mockToast.success).toHaveBeenCalledWith('First name and last name updated');
    });

    it('shows "Photo updated" when only the photo changes', async () => {
      component.avatarDirty.set(true);
      component.originalFile = new File(['img'], 'photo.jpg');
      jest.spyOn(component, 'exportCrop').mockResolvedValue(new Blob());

      await component.onSave();

      expect(mockToast.success).toHaveBeenCalledWith('Photo updated');
    });

    it('shows "First name, last name and photo updated" when all three change', async () => {
      component.firstName.set('Jane');
      component.lastName.set('Smith');
      component.avatarDirty.set(true);
      component.originalFile = new File(['img'], 'photo.jpg');
      jest.spyOn(component, 'exportCrop').mockResolvedValue(new Blob());

      await component.onSave();

      expect(mockToast.success).toHaveBeenCalledWith(
        'First name, last name and photo updated',
      );
    });

    it('shows no toast when nothing changed', async () => {
      await component.onSave();

      expect(mockToast.success).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // onSave — photo save
  // ---------------------------------------------------------------------------

  describe('onSave — photo save', () => {
    let mockBlob: Blob;

    beforeEach(() => {
      mockBlob = new Blob(['img'], { type: 'image/jpeg' });
      component.avatarDirty.set(true);
      component.originalFile = new File(['img'], 'photo.jpg');
      jest.spyOn(component, 'exportCrop').mockResolvedValue(mockBlob);
    });

    it('calls clerk.setProfileImage with the cropped blob', async () => {
      await component.onSave();

      expect(mockClerk.setProfileImage).toHaveBeenCalledWith(mockBlob);
    });

    it('retains editorSrc during setProfileImage to avoid flickering the old image', async () => {
      const existingUrl = 'http://api/users/u1/avatar?t=123';
      component.editorSrc.set(existingUrl);
      const urlDuringUpload: (string | undefined)[] = [];
      mockClerk.setProfileImage.mockImplementation(async () => {
        urlDuringUpload.push(component.editorSrc());
        return 'https://img.clerk.com/updated';
      });

      await component.onSave();

      expect(urlDuringUpload).toEqual([existingUrl]);
    });

    it('uploads the original file when one was captured', async () => {
      component.originalFile = new File(['raw'], 'photo.jpg');
      mockApi.post.mockResolvedValue({
        id: 'u1',
        avatarOriginalUrl: 'http://s3/orig.jpg',
        avatarCropState: null,
      });

      await component.onSave();

      expect(mockApi.post).toHaveBeenCalledWith('/users/me/avatar', expect.any(FormData));
    });

    it('does not upload an original file when none was captured', async () => {
      component.originalFile = null;

      await component.onSave();

      expect(mockApi.post).not.toHaveBeenCalled();
    });

    it('shows a toast when the original upload fails but still reports photo updated', async () => {
      component.originalFile = new File(['raw'], 'photo.jpg');
      mockApi.post.mockRejectedValue(new Error('S3 error'));

      await component.onSave();

      expect(mockToast.error).toHaveBeenCalledWith(
        'Full-size image could not be saved for future editing',
      );
      expect(mockToast.success).toHaveBeenCalledWith('Photo updated');
    });

    it('saves the current liveCropState when uploading the original file', async () => {
      const cropState: AvatarEditorCropState = { zoom: 2, offsetX: 10, offsetY: 5 };
      component.liveCropState.set(cropState);
      component.originalFile = new File(['raw'], 'photo.jpg');
      mockApi.post.mockResolvedValue({
        id: 'u1',
        avatarOriginalUrl: 'http://s3/orig.jpg',
        avatarCropState: cropState,
      });

      await component.onSave();

      expect(component.savedCropState()).toEqual(cropState);
      expect(mockUserService.setUser).toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // onSave — crop state
  // ---------------------------------------------------------------------------

  describe('onSave — crop state', () => {
    beforeEach(() => {
      component.savedCropState.set({ zoom: 1, offsetX: 0, offsetY: 0 });
      component.liveCropState.set({ zoom: 2, offsetX: 10, offsetY: 5 });
      jest.spyOn(component, 'exportCrop').mockResolvedValue(new Blob(['img']));
    });

    it('calls clerk.setProfileImage with the cropped blob when only crop changes', async () => {
      await component.onSave();

      expect(mockClerk.setProfileImage).toHaveBeenCalledWith(expect.any(Blob));
    });

    it('patches the backend with the new crop state when only crop changes', async () => {
      await component.onSave();

      expect(mockApi.patch).toHaveBeenCalledWith('/users/me', {
        avatarCropState: { zoom: 2, offsetX: 10, offsetY: 5 },
        clerkImageUrl: 'https://img.clerk.com/updated',
      });
    });

    it('updates savedCropState after saving crop state', async () => {
      await component.onSave();

      expect(component.savedCropState()).toEqual({ zoom: 2, offsetX: 10, offsetY: 5 });
    });

    it('shows "Photo updated" when only crop state changes', async () => {
      await component.onSave();

      expect(mockToast.success).toHaveBeenCalledWith('Photo updated');
    });

    it('does not patch for crop state when avatarDirty is set', async () => {
      component.avatarDirty.set(true);
      component.originalFile = new File(['img'], 'photo.jpg');
      jest.spyOn(component, 'exportCrop').mockResolvedValue(new Blob());

      await component.onSave();

      expect(mockApi.patch).not.toHaveBeenCalledWith(
        '/users/me',
        expect.objectContaining({ avatarCropState: expect.anything() }),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // onSave — photo remove
  // ---------------------------------------------------------------------------

  describe('onSave — photo remove', () => {
    beforeEach(async () => {
      mockClerk.user = signal({
        ...MOCK_USER,
        hasImage: true,
        imageUrl: 'http://clerk/img',
      });
      mockUserService.hasAvatar = signal(true);

      component = await createComponent(
        mockClerk,
        mockApi,
        mockUserService,
        mockToast,
        mockRouter,
      );
      component.onRemoveAvatar();
    });

    it('calls clerk.setProfileImage with null', async () => {
      await component.onSave();

      expect(mockClerk.setProfileImage).toHaveBeenCalledWith(null);
    });

    it('calls the delete avatar endpoint with the clerk image URL', async () => {
      await component.onSave();

      expect(mockApi.delete).toHaveBeenCalledWith(
        expect.stringContaining('/users/me/avatar?clerkImageUrl='),
      );
    });

    it('clears the avatar via userService after deletion', async () => {
      await component.onSave();

      expect(mockUserService.clearAvatar).toHaveBeenCalled();
    });

    it('shows a toast when the delete fails but still reports photo updated', async () => {
      mockApi.delete.mockRejectedValue(new Error('Delete error'));

      await component.onSave();

      expect(mockToast.error).toHaveBeenCalledWith(
        'Full-size image could not be removed',
      );
      expect(mockToast.success).toHaveBeenCalledWith('Photo updated');
    });

    it('does not call setProfileImage when the user has no existing photo', async () => {
      mockClerk.user = signal({ ...MOCK_USER, hasImage: false });
      mockUserService.hasAvatar = signal(false);

      component = await createComponent(
        mockClerk,
        mockApi,
        mockUserService,
        mockToast,
        mockRouter,
      );
      component.onRemoveAvatar();

      await component.onSave();

      expect(mockClerk.setProfileImage).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // onSave — state management
  // ---------------------------------------------------------------------------

  describe('onSave — state management', () => {
    it('sets saving to false after a successful save', async () => {
      component.firstName.set('Jane');

      await component.onSave();

      expect(component.saving()).toBe(false);
    });

    it('sets saving to false even when the save throws', async () => {
      component.firstName.set('Jane');
      mockClerk.updateProfile.mockRejectedValue(new Error('Clerk error'));

      await component.onSave();

      expect(component.saving()).toBe(false);
    });

    it('resets avatarDirty after a successful save', async () => {
      component.avatarDirty.set(true);
      component.originalFile = new File(['img'], 'photo.jpg');
      jest.spyOn(component, 'exportCrop').mockResolvedValue(new Blob());

      await component.onSave();

      expect(component.avatarDirty()).toBe(false);
    });

    it('resets removeAvatar after a successful save', async () => {
      mockClerk.user = signal({
        ...MOCK_USER,
        hasImage: true,
        imageUrl: 'http://clerk/img',
      });
      mockUserService.hasAvatar = signal(true);

      component = await createComponent(
        mockClerk,
        mockApi,
        mockUserService,
        mockToast,
        mockRouter,
      );
      component.onRemoveAvatar();

      await component.onSave();

      expect(component.removeAvatar()).toBe(false);
    });

    it('resets originalFile after a successful save', async () => {
      component.avatarDirty.set(true);
      component.originalFile = new File([''], 'test.jpg');
      jest.spyOn(component, 'exportCrop').mockResolvedValue(new Blob());

      await component.onSave();

      expect(component.originalFile).toBeNull();
    });

    it('shows an error toast and preserves state when the save throws', async () => {
      component.firstName.set('Jane');
      mockClerk.updateProfile.mockRejectedValue(new Error('Clerk error'));

      await component.onSave();

      expect(mockToast.error).toHaveBeenCalledWith('Something went wrong');
      expect(component.firstName()).toBe('Jane');
    });
  });

  // ---------------------------------------------------------------------------
  // onConfirmDelete
  // ---------------------------------------------------------------------------

  describe('onConfirmDelete', () => {
    it('calls the delete user endpoint', async () => {
      await component.onConfirmDelete();

      expect(mockApi.delete).toHaveBeenCalledWith('/users/me');
    });

    it('logs out and navigates to home after successful deletion', async () => {
      await component.onConfirmDelete();

      expect(mockClerk.logOut).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('closes the dialog after successful deletion', async () => {
      component.deleteDialogOpen.set(true);

      await component.onConfirmDelete();

      expect(component.deleteDialogOpen()).toBe(false);
    });

    it('sets deleting to false after successful deletion', async () => {
      await component.onConfirmDelete();

      expect(component.deleting()).toBe(false);
    });

    it('still navigates when logOut throws', async () => {
      mockClerk.logOut.mockRejectedValue(new Error('session invalid'));

      await component.onConfirmDelete();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('shows an error toast when the delete fails', async () => {
      mockApi.delete.mockRejectedValue(new Error('Server error'));

      await component.onConfirmDelete();

      expect(mockToast.error).toHaveBeenCalledWith('Something went wrong');
    });

    it('does not navigate when the delete fails', async () => {
      mockApi.delete.mockRejectedValue(new Error('Server error'));

      await component.onConfirmDelete();

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('sets deleting to false when the delete fails', async () => {
      mockApi.delete.mockRejectedValue(new Error('Server error'));

      await component.onConfirmDelete();

      expect(component.deleting()).toBe(false);
    });
  });
});
