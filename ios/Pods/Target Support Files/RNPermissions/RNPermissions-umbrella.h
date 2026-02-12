#ifdef __OBJC__
#import <UIKit/UIKit.h>
#else
#ifndef FOUNDATION_EXPORT
#if defined(__cplusplus)
#define FOUNDATION_EXPORT extern "C"
#else
#define FOUNDATION_EXPORT extern
#endif
#endif
#endif

#import "RNPermissions.h"
#import "RNPermissionHandlerPhotoLibraryAddOnly.h"
#import "RNPermissionHandlerPhotoLibrary.h"
#import "RNPermissionHandlerMediaLibrary.h"

FOUNDATION_EXPORT double RNPermissionsVersionNumber;
FOUNDATION_EXPORT const unsigned char RNPermissionsVersionString[];

