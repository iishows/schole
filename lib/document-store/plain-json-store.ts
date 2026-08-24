import type { DocumentStore } from '@openmaic/storage';

import type { AppScene } from '@/lib/types/stage';
import { omitUndefinedObjectMembers } from '@/lib/persistence/plain-json';

import type { AppStage } from './persistence-types';
import { sanitizeSceneActions } from './sanitize-actions';

let wrappers = new WeakMap<DocumentStore<AppScene, AppStage>, DocumentStore<AppScene, AppStage>>();

export function resetPlainJsonDocumentWritesForTests(): void {
  wrappers = new WeakMap();
}

/**
 * Storage-boundary normalization chain: drop undefined leaf fields, then
 * sanitize scene actions so chat-shape `type:"text"` / `type:"action"` items
 * from agent streams are remapped to dsl-shape before the storage validator
 * sees them.
 */
function prepDocument(document: unknown): unknown {
  return sanitizeSceneActions(omitUndefinedObjectMembers(document));
}

function prepScene(scene: unknown): unknown {
  return sanitizeSceneActions(omitUndefinedObjectMembers(scene));
}

export function withPlainJsonDocumentWrites(
  store: DocumentStore<AppScene, AppStage>,
): DocumentStore<AppScene, AppStage> {
  const existing = wrappers.get(store);
  if (existing) return existing;

  const methods: DocumentStore<AppScene, AppStage> = {
    saveDocument(document) {
      return store.saveDocument(prepDocument(document));
    },
    loadDocument(stageId) {
      return store.loadDocument(stageId);
    },
    listDocuments() {
      return store.listDocuments();
    },
    deleteDocument(stageId) {
      return store.deleteDocument(stageId);
    },
    putStage(stageId, stage) {
      return store.putStage(stageId, omitUndefinedObjectMembers(stage));
    },
    putScene(stageId, scene) {
      return store.putScene(stageId, prepScene(scene));
    },
    getScene(stageId, sceneId) {
      return store.getScene(stageId, sceneId);
    },
    deleteScene(stageId, sceneId) {
      return store.deleteScene(stageId, sceneId);
    },
  };
  const facade = Object.create(Object.getPrototypeOf(store)) as DocumentStore<AppScene, AppStage>;
  Object.defineProperties(facade, Object.getOwnPropertyDescriptors(methods));
  const wrapper = new Proxy(facade, {
    get(target, property, receiver) {
      if (Reflect.has(target, property)) {
        return Reflect.get(target, property, receiver) as unknown;
      }
      return Reflect.get(store, property, store) as unknown;
    },
  });
  wrappers.set(store, wrapper);
  wrappers.set(wrapper, wrapper);
  return wrapper;
}
