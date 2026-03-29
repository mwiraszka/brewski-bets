import { AvatarEditorCropEvent, ToastService } from '@eagami/ui';

import { NO_ERRORS_SCHEMA, WritableSignal, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ApiError, ApiService } from '@app/services/api.service';
import { ClerkService } from '@app/services/clerk.service';

import { AccountPageComponent } from './account-page.component';

jest.mock('@env', () => ({
  environment: {
    production: false,
    clerkPublishableKey: 'test-key',
    apiUrl: 'http://localhost:3000/api',
    preview: null,
  },
}));

const MOCK_API_URL = 'http://localhost:3000/api';

type MockUser = {
  firstName: string;
  lastName: string;
  hasImage: boolean;
  imageUrl: string;
};

type MockClerkService = {
  user: WritableSignal<MockUser | null>;
  updateProfile: jest.Mock<Promise<void>, [string, string]>;
  setProfileImage: jest.Mock<Promise<void>, [Blob | null]>;
  extractError: jest.Mock<string, [unknown]>;
};

type MockApiService = {
  get: jest.Mock<Promise<unknown>>;
  put: jest.Mock<Promise<unknown>>;
  patch: jest.Mock<Promise<unknown>>;
  post: jest.Mock<Promise<unknown>>;
  delete: jest.Mock<Promise<unknown>>;
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
  mockToast: MockToastService,
): Promise<AccountPageComponent> {
  TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [AccountPageComponent],
    providers: [
      { provide: ClerkService, useValue: mockClerk },
      { provide: ApiService, useValue: mockApi },
      { provide: ToastService, useValue: mockToast },
    ],
  })
    .overrideComponent(AccountPageComponent, {
      set: { imports: [], schemas: [NO_ERRORS_SCHEMA] },
    })
    .compileComponents();

  const fixture = TestBed.createComponent(AccountPageComponent);
  fixture.detectChanges();
  // ngOnInit's fire-and-forget fetchAvatarOriginalUrl resolves immediately (mockApi.get
  // uses Promise.resolve), so it settles before the microtask that resumes the caller.
  return fixture.componentInstance;
}

describe('AccountPageComponent', () => {
  let component: AccountPageComponent;
  let mockClerk: MockClerkService;
  let mockApi: MockApiService;
  let mockToast: MockToastService;

  beforeEach(async () => {
    mockClerk = {
      user: signal<MockUser | null>({ ...MOCK_USER }),
      updateProfile: jest.fn().mockResolvedValue(undefined),
      setProfileImage: jest.fn().mockResolvedValue(undefined),
      extractError: jest.fn().mockReturnValue('Something went wrong'),
    };

    mockApi = {
      get: jest.fn().mockResolvedValue({ id: 'user-1', avatarOriginalUrl: null }),
      put: jest.fn().mockResolvedValue({ id: 'user-1', avatarOriginalUrl: null }),
      patch: jest.fn().mockResolvedValue({}),
      post: jest.fn().mockResolvedValue({ id: 'user-1', avatarOriginalUrl: null }),
      delete: jest.fn().mockResolvedValue({}),
    };

    mockToast = {
      success: jest.fn().mockReturnValue(1),
      error: jest.fn().mockReturnValue(2),
    };

    component = await createComponent(mockClerk, mockApi, mockToast);
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

      component = await createComponent(mockClerk, mockApi, mockToast);

      expect(component.firstName()).toBe('');
      expect(component.lastName()).toBe('');
    });

    it('calls the API to load the avatar URL', async () => {
      await component.fetchAvatarOriginalUrl();

      expect(mockApi.get).toHaveBeenCalledWith('/users/me');
    });

    it('sets avatarOriginalUrl when the API returns a stored URL', async () => {
      mockApi.get.mockResolvedValue({
        id: 'user-1',
        avatarOriginalUrl: 'http://s3/orig.jpg',
      });

      await component.fetchAvatarOriginalUrl();

      expect(component.avatarOriginalUrl()).toBe(`${MOCK_API_URL}/users/user-1/avatar`);
    });

    it('shows error toast for unexpected API errors on avatar load', async () => {
      mockApi.get.mockRejectedValue(new ApiError('Server error', 500));

      await component.fetchAvatarOriginalUrl();

      expect(mockToast.error).toHaveBeenCalledWith('Full-size image could not be loaded');
    });

    it('silently ignores 401 errors on avatar load', async () => {
      mockApi.get.mockRejectedValue(new ApiError('Unauthorized', 401));

      await component.fetchAvatarOriginalUrl();

      expect(mockToast.error).not.toHaveBeenCalled();
    });

    it('creates the user record and continues when GET returns 404', async () => {
      mockApi.get.mockRejectedValue(new ApiError('Not found', 404));
      mockApi.put.mockResolvedValue({ id: 'user-1', avatarOriginalUrl: null });

      await component.fetchAvatarOriginalUrl();

      expect(mockApi.put).toHaveBeenCalledWith(
        '/users/me',
        expect.objectContaining({
          firstName: 'John',
          lastName: 'Doe',
        }),
      );
      expect(mockToast.error).not.toHaveBeenCalled();
    });

    it('silently ignores network errors on avatar load', async () => {
      mockApi.get.mockRejectedValue(new TypeError('Failed to fetch'));

      await component.fetchAvatarOriginalUrl();

      expect(mockToast.error).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // Computed: avatarSrc
  // ---------------------------------------------------------------------------

  describe('avatarSrc', () => {
    it('returns the backend avatar URL when avatarOriginalUrl is set', () => {
      component.avatarOriginalUrl.set(`${MOCK_API_URL}/users/u1/avatar`);

      expect(component.avatarSrc()).toBe(`${MOCK_API_URL}/users/u1/avatar`);
    });

    it('falls back to the Clerk image when no original URL is stored', async () => {
      mockClerk.user = signal({
        ...MOCK_USER,
        hasImage: true,
        imageUrl: 'http://clerk/photo',
      });

      component = await createComponent(mockClerk, mockApi, mockToast);

      expect(component.avatarSrc()).toBe('http://clerk/photo');
    });

    it('returns undefined when the user has no image at all', async () => {
      mockClerk.user = signal({ ...MOCK_USER, hasImage: false });

      component = await createComponent(mockClerk, mockApi, mockToast);

      expect(component.avatarSrc()).toBeUndefined();
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
  // onCropped
  // ---------------------------------------------------------------------------

  describe('onCropped', () => {
    it('resolves the exportCrop promise with the provided blob', async () => {
      const blob = new Blob(['img']);
      const cropPromise = component.exportCrop();

      component.onCropped({ blob, dataUrl: 'data:image/jpeg;base64,abc' });

      await expect(cropPromise).resolves.toBe(blob);
    });

    it('does nothing when no crop is pending', () => {
      const event: AvatarEditorCropEvent = {
        blob: new Blob(),
        dataUrl: 'data:image/jpeg;base64,abc',
      };

      expect(() => component.onCropped(event)).not.toThrow();
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
      jest.spyOn(component, 'hasEditorImage').mockReturnValue(true);
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
      jest.spyOn(component, 'hasEditorImage').mockReturnValue(true);
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
      jest.spyOn(component, 'hasEditorImage').mockReturnValue(true);
      jest.spyOn(component, 'exportCrop').mockResolvedValue(new Blob());

      await component.onSave();

      expect(mockToast.success).toHaveBeenCalledWith('Photo updated');
    });

    it('shows "First name, last name and photo updated" when all three change', async () => {
      component.firstName.set('Jane');
      component.lastName.set('Smith');
      component.avatarDirty.set(true);
      jest.spyOn(component, 'hasEditorImage').mockReturnValue(true);
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
      jest.spyOn(component, 'hasEditorImage').mockReturnValue(true);
      jest.spyOn(component, 'exportCrop').mockResolvedValue(mockBlob);
    });

    it('calls clerk.setProfileImage with the cropped blob', async () => {
      await component.onSave();

      expect(mockClerk.setProfileImage).toHaveBeenCalledWith(mockBlob);
    });

    it('uploads the original file when one was captured', async () => {
      component.originalFile = new File(['raw'], 'photo.jpg');
      mockApi.post.mockResolvedValue({
        id: 'u1',
        avatarOriginalUrl: 'http://s3/orig.jpg',
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
      component = await createComponent(mockClerk, mockApi, mockToast);
      component.onRemoveAvatar();
    });

    it('calls clerk.setProfileImage with null', async () => {
      await component.onSave();

      expect(mockClerk.setProfileImage).toHaveBeenCalledWith(null);
    });

    it('calls the delete avatar endpoint', async () => {
      await component.onSave();

      expect(mockApi.delete).toHaveBeenCalledWith('/users/me/avatar');
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
      component = await createComponent(mockClerk, mockApi, mockToast);
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
      jest.spyOn(component, 'hasEditorImage').mockReturnValue(true);
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
      component = await createComponent(mockClerk, mockApi, mockToast);
      component.onRemoveAvatar();

      await component.onSave();

      expect(component.removeAvatar()).toBe(false);
    });

    it('resets originalFile after a successful save', async () => {
      component.avatarDirty.set(true);
      component.originalFile = new File([''], 'test.jpg');
      jest.spyOn(component, 'hasEditorImage').mockReturnValue(true);
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
  // registerFileListeners
  // ---------------------------------------------------------------------------

  describe('registerFileListeners', () => {
    let hostEl: HTMLElement;

    beforeEach(() => {
      hostEl = document.createElement('div');
      component.registerFileListeners(hostEl);
    });

    it('sets originalFile on a change event', () => {
      const file = new File(['data'], 'photo.jpg');
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      hostEl.appendChild(input);

      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(component.originalFile).toBe(file);
    });

    it('sets avatarDirty to true on a change event', () => {
      const file = new File(['data'], 'photo.jpg');
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      hostEl.appendChild(input);

      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(component.avatarDirty()).toBe(true);
    });

    it('sets removeAvatar to false on a change event', () => {
      component.removeAvatar.set(true);
      const file = new File(['data'], 'photo.jpg');
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: [file], configurable: true });
      hostEl.appendChild(input);

      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(component.removeAvatar()).toBe(false);
    });

    it('ignores change events with no files', () => {
      const input = document.createElement('input');
      Object.defineProperty(input, 'files', { value: [], configurable: true });
      hostEl.appendChild(input);

      input.dispatchEvent(new Event('change', { bubbles: true }));

      expect(component.originalFile).toBeNull();
      expect(component.avatarDirty()).toBe(false);
    });

    it('sets originalFile on a drop event', () => {
      const file = new File(['data'], 'dropped.jpg');
      const dropEvent = new Event('drop') as Event & { dataTransfer: { files: File[] } };
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file] },
        configurable: true,
      });

      hostEl.dispatchEvent(dropEvent);

      expect(component.originalFile).toBe(file);
    });

    it('sets avatarDirty to true on a drop event', () => {
      const file = new File(['data'], 'dropped.jpg');
      const dropEvent = new Event('drop') as Event & { dataTransfer: { files: File[] } };
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file] },
        configurable: true,
      });

      hostEl.dispatchEvent(dropEvent);

      expect(component.avatarDirty()).toBe(true);
    });

    it('sets removeAvatar to false on a drop event', () => {
      component.removeAvatar.set(true);
      const file = new File(['data'], 'dropped.jpg');
      const dropEvent = new Event('drop') as Event & { dataTransfer: { files: File[] } };
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [file] },
        configurable: true,
      });

      hostEl.dispatchEvent(dropEvent);

      expect(component.removeAvatar()).toBe(false);
    });

    it('ignores drop events with no files', () => {
      const dropEvent = new Event('drop') as Event & { dataTransfer: { files: File[] } };
      Object.defineProperty(dropEvent, 'dataTransfer', {
        value: { files: [] },
        configurable: true,
      });

      hostEl.dispatchEvent(dropEvent);

      expect(component.originalFile).toBeNull();
      expect(component.avatarDirty()).toBe(false);
    });
  });
});
