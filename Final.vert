#version 330 compatibility 

out vec2 vST;
out vec3 vN;
out vec3 vL;
out vec3 vE;
out vec3 vMCposition;

uniform float uLightX, uLightY, uLightZ;
uniform float uA = 0.0, uB = 0.0 , uC = 0.0, uD = 0.0;

const float PI = 3.14159265359;

vec3 lightPos = vec3(uLightX, uLightY, uLightZ);

void main() {
	vST = gl_MultiTexCoord0.st;
	
	float x = gl_Vertex.x;
	float y = gl_Vertex.y;
	float r = sqrt(x * x + y * y);
	float z = uA*cos(2*PI*uB*r+uC)*exp(-uD*r);

	vec4 newVertex = vec4(x, y, z, 1.);
	vMCposition = newVertex.xyz;
	
	float drdx = x/r;
	float drdy = y/r;
	float dzdr = uA*(-sin(2*PI*uB*r+uC)*2*PI*uB*exp(-uD*r)+cos(2*PI*uB*r+uC)*(-uD)*exp(-uD*r));
	
	float dzdx = dzdr * drdx;
	float dzdy = dzdr * drdy;
	
	vec3 Tx = vec3(1., 0., dzdx);
	vec3 Ty = vec3(0., 1., dzdy);
	
	vec3 normal = normalize(cross(Tx, Ty));
	
	vec4 ECposition = gl_ModelViewMatrix * newVertex;
	vN = normalize(gl_NormalMatrix * normal);
	vL = lightPos - ECposition.xyz;
	vE = vec3(0., 0., 0.) - ECposition.xyz;
	gl_Position = gl_ModelViewProjectionMatrix * newVertex;
}