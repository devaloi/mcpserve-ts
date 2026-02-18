export interface ResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface ResourceProvider {
  list(): ResourceDefinition[];
  read(uri: string): Promise<ResourceContent | null>;
}

export interface ResourceContent {
  uri: string;
  mimeType: string;
  text: string;
}
